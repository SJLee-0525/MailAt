import sys
import json
import neo4j
import sqlite3
import os
import traceback # 자세한 오류 로그를 위해 추가

# --- embedding.py 통합을 위한 새로운 import ---
from bs4 import BeautifulSoup
import joblib
import torch
from sentence_transformers import SentenceTransformer
# --- 새로운 import 끝 ---

# --- 설정 ---
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASS = "message-gustav-rufus-alex-roman-2104"

_sbert_model_embed = None
_pca_model_embed = None
_xgb_model_embed = None
_le_model_embed = None

# 스크립트 디렉토리의 절대 경로 확인
script_dir = os.path.dirname(os.path.abspath(__file__))
# editemaildb.sqlite의 절대 경로 생성
SQLITE_DB_PATH = os.path.abspath(os.path.join(script_dir, "..", "..", "..", "..", "emaildb.sqlite"))
print(f"[Python] SQLITE_DB_PATH: {SQLITE_DB_PATH}", file=sys.stderr) # stderr로 변경

# --- embedding.py 통합을 위한 모델 및 규칙 설정 ---
# 모델 파일들이 이 스크립트와 동일한 디렉토리에 있다고 가정
SBERT_MODEL_FILE  = os.path.join(script_dir, 'sbert_model_miniLM.pkl')
XGB_MODEL_FILE    = os.path.join(script_dir, 'xgb_model_384to64_miniLM.pkl')
PCA_MODEL_FILE    = os.path.join(script_dir, 'pca_64_from_384_miniLM.pkl')
LE_MODEL_FILE     = os.path.join(script_dir, 'label_encoder_384to64_miniLM.pkl')

EMBEDDING_RULES = [
    ("주소를 찾을 수 없음", "개인:알림"),
    ("메일을 전송하지 못했습니다", "개인:알림"),
    ("지원 결과", "채용:결과"),
    ("면접 일정", "채용:결과"),
    ("채용공고", "채용:공고"),
    ("공고", "채용:공고"),
    ("모집", "채용:공고"),
    ("(광고)", "광고:교육"),
    ("인프런", "광고:교육"),
    ("강의", "광고:교육"),
    ("워크샵", "회사:공지"),
    ("연차", "회사:공지"),
    ("휴가", "회사:공지"),
    ("회식", "회사:공지"),
]
# --- 모델 및 규칙 설정 끝 ---

# search_node.py 에서 가져옴 (read_node_py 용도)
LABEL_MAP_SN = {0: 'Root', 1: 'Person', 2: 'Category', 3: 'Subcategory'}
CTYPE_MAP_SN = {v: k for k, v in LABEL_MAP_SN.items()}

driver = None

def get_driver():
    global driver
    if driver is None:
        try:
            driver = neo4j.GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
            driver.verify_connectivity() # 연결 확인
            print("[Python] Neo4j driver initialized and connected.", file=sys.stderr) # stderr로 변경
        except neo4j.exceptions.AuthError as e:
            print(f"[Python] Neo4j authentication failed: {e}", file=sys.stderr) # stderr로 변경
            raise
        except neo4j.exceptions.ServiceUnavailable as e:
            print(f"[Python] Neo4j service unavailable: {e}", file=sys.stderr) # stderr로 변경
            raise
        except Exception as e:
            print(f"[Python] Error initializing Neo4j driver: {e}", file=sys.stderr) # stderr로 변경
            raise
    return driver

def close_driver():
    global driver
    if driver is not None:
        driver.close()
        driver = None
        print("[Python] Neo4j driver closed.", file=sys.stderr) # stderr로 변경

def _execute_query(query, params=None):
    """쿼리 실행 및 세션 처리를 위한 헬퍼 함수."""
    loc_driver = get_driver()
    with loc_driver.session(database="neo4j") as session: # 명시적으로 데이터베이스 지정
        try:
            result = session.run(query, params)
            return result
        except Exception as e:
            print(f"[Python] Error executing query: {query} with params {params}. Error: {e}", file=sys.stderr) # stderr로 변경
            raise

def initialize_graph_from_sqlite_py():
    print("[Python] Attempting to initialize graph from SQLite...", file=sys.stderr) # stderr로 변경
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"[Python] SQLite database file not found at {SQLITE_DB_PATH}", file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: SQLite database file not found at {SQLITE_DB_PATH}"}

    try:
        # 1) SQLite에서 데이터 로드
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cur = conn.cursor()
        print("[Python] Connected to SQLite.", file=sys.stderr) # stderr로 변경

        cur.execute("SELECT email FROM Account;")
        account_emails = [row[0].lower() for row in cur.fetchall()]
        print(f"[Python] Loaded {len(account_emails)} account emails from SQLite.", file=sys.stderr) # stderr로 변경

        cur.execute("SELECT message_id, category_id, sub_category_id, from_email, subject, sent_at FROM Message;") # Message 테이블에서 필요한 컬럼 추가
        messages_data = cur.fetchall()
        print(f"[Python] Loaded {len(messages_data)} messages from SQLite.", file=sys.stderr) # stderr로 변경

        msg_contacts = {} # {message_id: {'from': [contact_id], 'to': [contact_id], 'cc': [contact_id], 'bcc': [contact_id]}}
        cur.execute("SELECT message_id, contact_id, type FROM MessageContact;")
        for mid, cid, typ in cur.fetchall():
            if mid not in msg_contacts:
                msg_contacts[mid] = {'from': [], 'to': [], 'cc': [], 'bcc': []}
            # type이 실제 MessageContact 테이블의 'type' 컬럼 값에 따라 다를 수 있음 (예: 'FROM', 'TO', 'CC')
            if typ.upper() == 'FROM': # type 값을 대문자로 비교하여 일관성 유지
                 msg_contacts[mid]['from'].append(cid)
            elif typ.upper() == 'TO':
                 msg_contacts[mid]['to'].append(cid)
            elif typ.upper() == 'CC':
                 msg_contacts[mid]['cc'].append(cid)
            elif typ.upper() == 'BCC':
                msg_contacts[mid]['bcc'].append(cid)

        print(f"[Python] Loaded {len(msg_contacts)} message contact relations from SQLite.", file=sys.stderr) # stderr로 변경

        cur.execute("SELECT contact_id, name, email FROM EmailContact;")
        email_contacts_map = {cid: (name, email.lower() if email else None) for cid, name, email in cur.fetchall()}
        print(f"[Python] Loaded {len(email_contacts_map)} email contacts from SQLite.", file=sys.stderr) # stderr로 변경

        cur.execute("SELECT category_id, category_name FROM Category;")
        category_map = {cid: name for cid, name in cur.fetchall()}
        print(f"[Python] Loaded {len(category_map)} categories from SQLite.", file=sys.stderr) # stderr로 변경
        conn.close()
        print("[Python] SQLite connection closed.", file=sys.stderr) # stderr로 변경

        # 2) Neo4j 연결 및 그래프 생성
        loc_driver = get_driver()
        with loc_driver.session(database="neo4j") as sess: # 명시적으로 데이터베이스 지정
            print("[Python] Neo4j session started.", file=sys.stderr) # stderr로 변경
            # 기존 그래프 데이터 삭제 (초기화 시 필요할 수 있음, 주의해서 사용)
            # print("[Python] Clearing existing graph data...", file=sys.stderr)
            # sess.run("MATCH (n) DETACH DELETE n")
            # print("[Python] Existing graph data cleared.", file=sys.stderr)

            # Account 노드 생성
            for acc_email in account_emails:
                sess.run("MERGE (a:Account {email: $email})", email=acc_email)
            print(f"[Python] Created/Merged {len(account_emails)} Account nodes.", file=sys.stderr) # stderr로 변경

            # Person 노드 생성 (EmailContact 기반)
            for contact_id, (name, email) in email_contacts_map.items():
                if email: # 이메일이 있는 경우에만 Person 노드 생성 시도
                    sess.run("MERGE (p:Person {email: $email}) ON CREATE SET p.contact_id = $contact_id, p.name = $name ON MATCH SET p.contact_id = coalesce(p.contact_id, $contact_id), p.name = coalesce(p.name, $name)",
                             contact_id=contact_id, name=name, email=email)
                elif name: # 이메일은 없지만 이름은 있는 경우 (예: 로컬 주소록의 이름만 있는 연락처)
                     sess.run("MERGE (p:Person {name: $name, contact_id: $contact_id})", # 이메일 없이 이름과 ID로 MERGE
                             contact_id=contact_id, name=name)

            print(f"[Python] Created/Merged {len(email_contacts_map)} Person nodes (based on email_contacts_map).", file=sys.stderr) # stderr로 변경

            # Category 노드 생성
            for cat_id, cat_name in category_map.items():
                sess.run("MERGE (c:Category {category_id: $cat_id}) SET c.name = $cat_name",
                         cat_id=cat_id, cat_name=cat_name)
            print(f"[Python] Created/Merged {len(category_map)} Category nodes.", file=sys.stderr) # stderr로 변경

            # Message 노드 및 관계 생성
            for msg_id, cat_id, sub_cat_id, from_email_sqlite, subject, sent_at in messages_data:
                # Message 노드 생성 (message_id를 고유 식별자로 사용)
                sess.run("MERGE (m:Message {message_id: $msg_id}) SET m.subject = $subject, m.sent_at = $sent_at, m.from_address_raw = $from_email",
                         msg_id=msg_id, subject=subject, sent_at=sent_at, from_email=from_email_sqlite)

                # Message와 Category 연결
                if cat_id and cat_id in category_map:
                    sess.run("""
                        MATCH (m:Message {message_id: $msg_id})
                        MATCH (c:Category {category_id: $cat_id})
                        MERGE (m)-[:BELONGS_TO]->(c)
                    """, msg_id=msg_id, cat_id=cat_id)

                # Message와 Person (보낸 사람) 연결
                # msg_contacts에 해당 message_id의 'from' 정보가 있는지 확인
                if msg_id in msg_contacts and msg_contacts[msg_id]['from']:
                    sender_contact_id = msg_contacts[msg_id]['from'][0] # 첫 번째 보낸 사람 ID 사용
                    if sender_contact_id in email_contacts_map and email_contacts_map[sender_contact_id][1]: # 이메일 주소가 있는지 확인
                        sender_email = email_contacts_map[sender_contact_id][1]
                        sess.run("""
                            MATCH (m:Message {message_id: $msg_id})
                            MATCH (p:Person {email: $sender_email})
                            MERGE (p)-[:SENT]->(m)
                        """, msg_id=msg_id, sender_email=sender_email)
                elif from_email_sqlite: # MessageContact에 정보가 없고 Message 테이블에 from_email이 있다면
                    sess.run("""
                        MATCH (m:Message {message_id: $msg_id})
                        MERGE (p:Person {email: $from_email_sqlite}) // 보낸 사람 Person 노드 (없으면 생성)
                        MERGE (p)-[:SENT]->(m)
                    """, msg_id=msg_id, from_email_sqlite=from_email_sqlite.lower())


                # Message와 Person (받는 사람 - TO, CC, BCC) 연결
                if msg_id in msg_contacts:
                    for rel_type, contact_ids in msg_contacts[msg_id].items():
                        if rel_type == 'from': continue # 보낸 사람은 위에서 처리
                        neo_rel_type = ""
                        if rel_type == 'to': neo_rel_type = "ADDRESSED_TO"
                        elif rel_type == 'cc': neo_rel_type = "CC_TO"
                        elif rel_type == 'bcc': neo_rel_type = "BCC_TO"

                        if neo_rel_type:
                            for recipient_contact_id in contact_ids:
                                if recipient_contact_id in email_contacts_map and email_contacts_map[recipient_contact_id][1]: # 이메일 주소가 있는지 확인
                                    recipient_email = email_contacts_map[recipient_contact_id][1]
                                    sess.run(f"""
                                        MATCH (m:Message {{message_id: $msg_id}})
                                        MATCH (p:Person {{email: $recipient_email}})
                                        MERGE (m)-[:{neo_rel_type}]->(p)
                                    """, msg_id=msg_id, recipient_email=recipient_email)
            print("[Python] Created/Merged Message nodes and their relationships.", file=sys.stderr) # stderr로 변경

            # Account와 Person (사용자 자신) 연결
            # Account의 이메일과 일치하는 Person 노드가 있다면 :IS_USER 관계 추가
            for acc_email_val in account_emails:
                 sess.run("""
                    MATCH (acc:Account {email: $acc_email})
                    MATCH (p:Person {email: $acc_email}) // 계정 이메일과 동일한 이메일을 가진 Person
                    MERGE (acc)-[:IS_PERSON]->(p)
                    MERGE (p)-[:IS_ACCOUNT_HOLDER_OF]->(acc) // 양방향 또는 단방향 선택
                 """, acc_email=acc_email_val)
            print("[Python] Linked Account nodes to their corresponding Person nodes.", file=sys.stderr) # stderr로 변경

            print("[Python] Neo4j session finished.", file=sys.stderr) # stderr로 변경
        return {"status": "success", "message": "Python: Graph initialized successfully from SQLite."}
    except sqlite3.Error as e:
        print(f"[Python] SQLite error: {e}", file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: SQLite error - {str(e)}"}
    except neo4j.exceptions.Neo4jError as e:
        print(f"[Python] Neo4jError: {e}", file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: Neo4jError - {str(e)}"}
    except Exception as e:
        import traceback
        print(f"[Python] Error initializing graph: {str(e)}", file=sys.stderr) # stderr로 변경
        print(traceback.format_exc(), file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: Error initializing graph - {str(e)}"}

def _html_to_text_embed(html: str) -> str:
    if not html:
        return ''
    return BeautifulSoup(html, 'html.parser').get_text(separator=' ', strip=True)

def _apply_rules_embed(text: str) -> str | None:
    for kw, lbl in EMBEDDING_RULES:
        if kw in text:
            return lbl
    return None

def _load_embedding_models():
    global _sbert_model_embed, _pca_model_embed, _xgb_model_embed, _le_model_embed
    if _sbert_model_embed is None:
        print("[Python Embedding] Loading SBERT model...", file=sys.stderr) # stderr로 변경
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _sbert_model_embed = SentenceTransformer(SBERT_MODEL_FILE, device=device)
        print(f"[Python Embedding] SBERT model loaded on {device}.", file=sys.stderr) # stderr로 변경
    if _pca_model_embed is None:
        print("[Python Embedding] Loading PCA model...", file=sys.stderr) # stderr로 변경
        _pca_model_embed = joblib.load(PCA_MODEL_FILE)
        print("[Python Embedding] PCA model loaded.", file=sys.stderr) # stderr로 변경
    if _xgb_model_embed is None:
        print("[Python Embedding] Loading XGBoost model...", file=sys.stderr) # stderr로 변경
        _xgb_model_embed = joblib.load(XGB_MODEL_FILE)
        print("[Python Embedding] XGBoost model loaded.", file=sys.stderr) # stderr로 변경
    if _le_model_embed is None:
        print("[Python Embedding] Loading LabelEncoder model...", file=sys.stderr) # stderr로 변경
        _le_model_embed = joblib.load(LE_MODEL_FILE)
        print("[Python Embedding] LabelEncoder model loaded.", file=sys.stderr) # stderr로 변경

def _predict_label_embed(text: str) -> str:
    _load_embedding_models()
    emb = _sbert_model_embed.encode([text])
    emb_pca = _pca_model_embed.transform(emb)
    pred_num = _xgb_model_embed.predict(emb_pca)[0]
    return _le_model_embed.inverse_transform([pred_num])[0]

def process_and_embed_messages_py():
    print("[Python] Attempting to process and embed messages...", file=sys.stderr) # stderr로 변경
    if not os.path.exists(SQLITE_DB_PATH):
        return {"status": "error", "message": f"Python: SQLite database file not found at {SQLITE_DB_PATH}"}

    conn = None
    try:
        _load_embedding_models() # 모델 로드 확인

        conn = sqlite3.connect(SQLITE_DB_PATH)
        cur = conn.cursor()
        print("[Python Embedding] Connected to SQLite for embedding.", file=sys.stderr) # stderr로 변경

        # body_text 컬럼이 없는 경우 확인 및 추가
        cur.execute("PRAGMA table_info(Message);")
        cols = [r[1] for r in cur.fetchall()]
        if 'body_text' not in cols:
            print("[Python Embedding] 'body_text' column not found in Message table. Adding it.", file=sys.stderr) # stderr로 변경
            cur.execute("ALTER TABLE Message ADD COLUMN body_text TEXT;")
            conn.commit()
            print("[Python Embedding] 'body_text' column added.", file=sys.stderr) # stderr로 변경

        # 카테고리 캐시
        cur.execute("SELECT category_id, category_name FROM Category;")
        category_cache = {name: cid for cid, name in cur.fetchall()}

        def get_or_create_category_embed(label: str) -> int:
            if label in category_cache:
                return category_cache[label]
            cur.execute("INSERT INTO Category (category_name) VALUES (?);", (label,))
            conn.commit() # Commit after insert to get lastrowid
            cid = cur.lastrowid
            category_cache[label] = cid
            print(f"[Python Embedding] Created new category '{label}' with ID {cid}", file=sys.stderr) # stderr로 변경
            return cid

        # 1) HTML -> 일반 텍스트
        cur.execute("SELECT rowid, body_html FROM Message WHERE body_text IS NULL OR body_text = '';") # body_text가 비어 있거나 null인 경우에만 처리
        rows = cur.fetchall()
        text_updates = []
        if not rows:
            print("[Python Embedding] No messages found needing body_text conversion.", file=sys.stderr) # stderr로 변경
        else:
            print(f"[Python Embedding] Found {len(rows)} messages for body_text conversion.", file=sys.stderr) # stderr로 변경
            for rowid, html_content in rows:
                plain = _html_to_text_embed(html_content)
                text_updates.append((plain, rowid))
            
            if text_updates:
                cur.executemany("UPDATE Message SET body_text = ? WHERE rowid = ?;", text_updates)
                conn.commit()
                print(f"[Python Embedding] {len(text_updates)} records updated with body_text.", file=sys.stderr) # stderr로 변경

        # 2) 텍스트 임베딩 + 분류 -> 카테고리 업데이트
        cur.execute("SELECT message_id, body_text FROM Message WHERE category_id IS NULL;") # category_id가 null인 경우에만 처리
        msgs = cur.fetchall()
        label_updates = []

        if not msgs:
            print("[Python Embedding] No messages found needing category assignment.", file=sys.stderr) # stderr로 변경
        else:
            print(f"[Python Embedding] Found {len(msgs)} messages for category assignment.", file=sys.stderr) # stderr로 변경
            for mid, text_content in msgs:
                if not text_content:
                    print(f"[Python Embedding] Message ID {mid} has empty body_text, skipping.", file=sys.stderr) # stderr로 변경
                    continue
                
                label = _apply_rules_embed(text_content)
                if label:
                    print(f"[Python Embedding] Message ID {mid} classified by rule: {label}", file=sys.stderr) # stderr로 변경
                else:
                    label = _predict_label_embed(text_content)
                    print(f"[Python Embedding] Message ID {mid} classified by ML model: {label}", file=sys.stderr) # stderr로 변경
                
                cid = get_or_create_category_embed(label)
                # Assuming sub_category_id is same as category_id for now as per embedding.py
                label_updates.append((cid, cid, mid))

            if label_updates:
                cur.executemany("UPDATE Message SET category_id = ?, sub_category_id = ? WHERE message_id = ?;", label_updates)
                conn.commit()
                print(f"[Python Embedding] {len(label_updates)} messages updated with category and sub_category IDs.", file=sys.stderr) # stderr로 변경
        
        return {"status": "success", "message": "Python: Message processing and embedding complete."}

    except sqlite3.Error as e:
        print(f"[Python Embedding] SQLite error: {e}", file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: SQLite error during embedding - {str(e)}"}
    except Exception as e:
        print(f"[Python Embedding] Error during embedding: {str(e)}", file=sys.stderr) # stderr로 변경
        traceback.print_exc(file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: Error during embedding - {str(e)}"}
    finally:
        if conn:
            conn.close()
            print("[Python Embedding] SQLite connection closed.", file=sys.stderr) # stderr로 변경

def build_graph_py():
    print("[Python] Attempting to build graph  from SQLite...", file=sys.stderr) # stderr로 변경
    if not os.path.exists(SQLITE_DB_PATH):
        return {"status": "error", "message": f"Python: SQLite database file not found at {SQLITE_DB_PATH}"}

    conn_sqlite = None
    try:
        conn_sqlite = sqlite3.connect(SQLITE_DB_PATH)
        cur_sqlite = conn_sqlite.cursor()
        print("[Python BuildGraph] Connected to SQLite.", file=sys.stderr) # stderr로 변경

        cur_sqlite.execute("SELECT email FROM Account;")
        account_emails = [row[0].lower() for row in cur_sqlite.fetchall()]
        print(f"[Python BuildGraph] Loaded {len(account_emails)} account emails.", file=sys.stderr) # stderr로 변경

        cur_sqlite.execute("SELECT message_id, category_id, sub_category_id FROM Message;")
        messages = cur_sqlite.fetchall()
        print(f"[Python BuildGraph] Loaded {len(messages)} messages.", file=sys.stderr) # stderr로 변경

        msg_contacts = {}
        cur_sqlite.execute("SELECT message_id, contact_id, type FROM MessageContact;")
        for mid, cid, typ in cur_sqlite.fetchall():
            msg_contacts.setdefault(mid, {}).setdefault(typ.upper(), []).append(cid) # Ensure type is upper
        print(f"[Python BuildGraph] Loaded {len(msg_contacts)} message contact relations.", file=sys.stderr) # stderr로 변경

        cur_sqlite.execute("SELECT contact_id, name, email FROM EmailContact;")
        email_contacts = {cid: (name, email.lower() if email else None) for cid, name, email in cur_sqlite.fetchall()}
        print(f"[Python BuildGraph] Loaded {len(email_contacts)} email contacts.", file=sys.stderr) # stderr로 변경

        cur_sqlite.execute("SELECT category_id, category_name FROM Category;")
        category_map = {cid: name for cid, name in cur_sqlite.fetchall()}
        print(f"[Python BuildGraph] Loaded {len(category_map)} categories.", file=sys.stderr) # stderr로 변경
        
        conn_sqlite.close()
        print("[Python BuildGraph] SQLite connection closed.", file=sys.stderr) # stderr로 변경

        loc_driver = get_driver()
        with loc_driver.session(database="neo4j") as sess:
            print("[Python BuildGraph] Neo4j session started.", file=sys.stderr) # stderr로 변경
            print("[Python BuildGraph] Clearing existing graph data...", file=sys.stderr) # stderr로 변경
            sess.run("MATCH (n) DETACH DELETE n")
            print("[Python BuildGraph] Existing graph data cleared.", file=sys.stderr) # stderr로 변경

            print("[Python BuildGraph] Creating Root node...", file=sys.stderr) # stderr로 변경
            sess.run(
                """
                MERGE (root:Root {name: '나'})
                ON CREATE SET root.emails = $emails,
                                root.contact_id = 0 
                ON MATCH SET  root.emails = $emails, 
                                root.contact_id = 0
                """, emails=account_emails) # contact_id = 0 for '나'

            processed_msg_count = 0
            for msg_id, cat_id, subcat_id in messages:
                category_name = category_map.get(cat_id)
                if not category_name:
                    continue
                
                subcategory_name = category_map.get(subcat_id) if subcat_id is not None and subcat_id in category_map else None

                contacts_for_msg = msg_contacts.get(msg_id, {})
                
                # Determine primary interactors (recipients not in account_emails, else sender)
                # Ensure TO, FROM etc are uppercase due to earlier processing
                recipients_cids = []
                if 'TO' in contacts_for_msg:
                    recipients_cids.extend(contacts_for_msg['TO'])
                if 'CC' in contacts_for_msg:
                    recipients_cids.extend(contacts_for_msg['CC'])
                if 'BCC' in contacts_for_msg:
                    recipients_cids.extend(contacts_for_msg['BCC'])

                interactor_cids = [
                    cid for cid in recipients_cids 
                    if email_contacts.get(cid, ('', ''))[1] not in account_emails and email_contacts.get(cid, ('', ''))[1] is not None
                ]

                if not interactor_cids and 'FROM' in contacts_for_msg: # If no external recipients, use sender
                    interactor_cids = [
                        cid for cid in contacts_for_msg['FROM']
                        if email_contacts.get(cid, ('', ''))[1] not in account_emails and email_contacts.get(cid, ('', ''))[1] is not None
                    ]
                
                if not interactor_cids: # Still no one? Maybe it's an email to self or from self to no one external.
                                        # Or a draft. For now, we'll skip if no clear interactor outside of self.
                                        # Or, if FROM is self, and TO is self, we might want to link to self-category.
                                        # This part might need refinement based on desired graph semantics.
                    continue

                for contact_id_val in interactor_cids:
                    name, email = email_contacts.get(contact_id_val, (None, None))
                    if not name or not email: # Must have name and email to be a Person node here
                        continue
                    
                    # 1) Root-Person
                    sess.run(
                        """
                        MATCH (root:Root {name: '나'})
                        MERGE (p:Person {contact_id: $cid_val})
                          ON CREATE SET p.name = $p_name, p.email = $p_email
                          ON MATCH SET  p.name = $p_name, p.email = $p_email
                        MERGE (root)-[r1:INTERACTS_WITH]->(p)
                        SET r1.msg_ids = coalesce(r1.msg_ids, []) + [$msg_id_val]
                        """, {
                            'cid_val': contact_id_val, 'p_name': name, 'p_email': email,
                            'msg_id_val': msg_id
                        })

                    # 2) Person-Category
                    sess.run(
                        """
                        MATCH (p:Person {contact_id: $cid_val})
                        MERGE (c:Category {category_id: $cat_id_val})
                          ON CREATE SET c.name = $cat_name_val
                          ON MATCH SET  c.name = $cat_name_val
                        MERGE (p)-[r2:HAS_CATEGORY]->(c)
                        SET r2.msg_ids = coalesce(r2.msg_ids, []) + [$msg_id_val]
                        """, {
                            'cid_val': contact_id_val, 'cat_id_val': cat_id, 
                            'cat_name_val': category_name, 'msg_id_val': msg_id
                        })

                    # 3) Category-Subcategory (if subcategory_name exists)
                    if subcategory_name and subcat_id is not None:
                        sess.run(
                            """
                            MATCH (c:Category {category_id: $cat_id_val})
                            MERGE (s:Subcategory {subcategory_id: $subcat_id_val})
                              ON CREATE SET s.name = $subcat_name_val
                              ON MATCH SET  s.name = $subcat_name_val
                            MERGE (c)-[sr:HAS_SUBCATEGORY]->(s)
                            SET sr.cids = apoc.coll.toSet(coalesce(sr.cids, []) + [$cid_val]), // Use toSet for uniqueness
                                sr.msg_ids = apoc.coll.toSet(coalesce(sr.msg_ids, []) + [$msg_id_val]) // Use toSet for uniqueness
                            """, {
                                'cat_id_val': cat_id, 'subcat_id_val': subcat_id,
                                'subcat_name_val': subcategory_name, 'cid_val': contact_id_val,
                                'msg_id_val': msg_id
                            })
                processed_msg_count += 1
            
            print(f"[Python BuildGraph] Processed {processed_msg_count} messages into the graph structure.", file=sys.stderr) # stderr로 변경
            print("[Python BuildGraph] Neo4j session finished.", file=sys.stderr) # stderr로 변경
        return {"status": "success", "message": "Python: Graph  built successfully from SQLite."}

    except sqlite3.Error as e:
        print(f"[Python BuildGraph] SQLite error: {e}", file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: SQLite error in BuildGraph - {str(e)}"}
    except neo4j.exceptions.Neo4jError as e:
        print(f"[Python BuildGraph] Neo4jError: {e}", file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: Neo4jError in BuildGraph - {str(e)}"}
    except Exception as e:
        print(f"[Python BuildGraph] Error building graph : {str(e)}", file=sys.stderr) # stderr로 변경
        traceback.print_exc(file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: Error building graph  - {str(e)}"}
    finally:
        if conn_sqlite:
            conn_sqlite.close()
            print("[Python BuildGraph] SQLite connection closed (in finally).", file=sys.stderr) # stderr로 변경

def fetch_nodes_py(c_id, c_type, io_type):
    print(f"[Python FetchNodes] Fetching nodes for C_ID: {c_id}, C_type: {c_type}, IO_type: {io_type}", file=sys.stderr) # stderr로 변경
    try:
        loc_driver = get_driver()
        label = LABEL_MAP_SN.get(c_type)
        if not label:
            return {"status": "error", "message": f"Python: Invalid C_type {c_type}"}

        # 중심 노드의 C_type에 따른 속성 이름 결정
        # search_node.py의 로직과 일치
        prop = 'contact_id' if c_type in (0, 1) else 'category_id' if c_type == 2 else 'subcategory_id'

        if io_type == 1: # incoming
            rel_pattern = f"(x)-[r]->(n:{label} {{{prop}: $cid_val}})"
        elif io_type == 2: # outgoing
            rel_pattern = f"(n:{label} {{{prop}: $cid_val}})-[r]->(x)"
        else: # both (io_type == 3 or other)
            rel_pattern = f"(x)-[r]-(n:{label} {{{prop}: $cid_val}})"
        
        nodes_result = []
        with loc_driver.session(database="neo4j") as session:
            # 중심 노드 가져오기
            center_node_query = f"MATCH (n:{label} {{{prop}: $cid_val}}) RETURN n.name AS name, n.{prop} AS id_val, n.contact_id as contact_id, n.category_id as category_id, n.subcategory_id as subcategory_id"
            center_rec = session.run(center_node_query, cid_val=c_id).single()

            if not center_rec:
                return {"status": "error", "message": f"Python: Node {label} with {prop}={c_id} not found."}
            
            center_name = center_rec['name']
            # C_ID와 일치하는 특정 ID 속성 사용
            center_actual_cid = center_rec['id_val'] 
            
            # 중심 노드를 결과에 추가
            # 중심 노드 자체의 개수는 search_node.py 논리에 직접적으로 주어지지 않으며, 0으로 설정
            nodes_result.append({'id': 0, 'C_ID': center_actual_cid, 'C_type': c_type, 'data': {'label': center_name}, 'count': 0})
            seen_node_keys = { (center_actual_cid, c_type) } # 그래프에 사이클이나 여러 경로가 있는 경우 중복 노드를 피하기 위해
            
            # 이웃 노드 및 관계의 메시지 개수 가져오기
            neighbor_query = (
                f"MATCH {rel_pattern} "
                "WHERE x.name IS NOT NULL " # 이웃에 이름이 있는지 확인
                "RETURN DISTINCT x.name AS name, labels(x) AS labs, "
                "x.contact_id AS contact_id, x.category_id AS category_id, x.subcategory_id AS subcategory_id, "
                "size(coalesce(r.msg_ids, [])) AS msg_count " # 관계의 msg_ids에서 개수 가져오기
                "ORDER BY msg_count DESC" # 메시지 개수 기준으로 정렬
            )
            
            rows = session.run(neighbor_query, cid_val=c_id).data()
            
            idx = 1
            for r_data in rows:
                neighbor_name = r_data['name']
                neighbor_labels = r_data.get('labs') or []
                
                node_c_type, node_c_id = None, None

                # 이웃의 C_type 및 C_ID 결정
                if 'Person' in neighbor_labels:
                    node_c_type = CTYPE_MAP_SN.get('Person')
                    node_c_id = r_data['contact_id']
                elif 'Root' in neighbor_labels: # Root는 일반적으로 C_type 0
                    node_c_type = CTYPE_MAP_SN.get('Root')
                    node_c_id = r_data.get('contact_id') # make_node.py의 Root는 contact_id = 0
                elif 'Category' in neighbor_labels:
                    node_c_type = CTYPE_MAP_SN.get('Category')
                    node_c_id = r_data['category_id']
                elif 'Subcategory' in neighbor_labels:
                    node_c_type = CTYPE_MAP_SN.get('Subcategory')
                    node_c_id = r_data['subcategory_id']
                else: # Fallback 또는 알 수 없는 유형
                    continue 

                if node_c_id is None: # C_ID를 결정할 수 없는 경우 건너뜀
                    continue

                node_key = (node_c_id, node_c_type)
                if node_key in seen_node_keys:
                    continue # 이미 추가된 노드는 건너뜀
                seen_node_keys.add(node_key)

                nodes_result.append({
                    'id': idx, 
                    'C_ID': node_c_id, 
                    'C_type': node_c_type, 
                    'data': {'label': neighbor_name},
                    'count': r_data.get('msg_count', 0) # 관계에서 메시지 개수
                })
                idx += 1
        
        # search_node.py는 이웃을 개수 기준으로 정렬한 후 중심 노드에 추가합니다. 쿼리에서 이미 정렬됨.
        print(f"[Python FetchNodes] Fetched {len(nodes_result)} nodes.", file=sys.stderr) # stderr로 변경
        return {"status": "success", "message": "Python: Nodes () fetched successfully.", "result": {"nodes": nodes_result}}
    except neo4j.exceptions.Neo4jError as e:
        print(f"[Python FetchNodes] Neo4jError: {e}", file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: Neo4jError fetching nodes () - {str(e)}"}
    except Exception as e:
        print(f"[Python FetchNodes] Error fetching nodes (): {str(e)}", file=sys.stderr) # stderr로 변경
        traceback.print_exc(file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: Error fetching nodes () - {str(e)}"}

def fetch_emails_py(basic_c_id, c_type, io_type, in_data=None): # search_mail.py 시그니처와 일치
    print(f"[Python FetchEmails] Fetching emails for basic_C_ID: {basic_c_id}, C_type: {c_type}, IO_type: {io_type}, In_data: {in_data}", file=sys.stderr) # stderr로 변경
    if not os.path.exists(SQLITE_DB_PATH):
        return {"status": "error", "message": f"Python: SQLite database file not found at {SQLITE_DB_PATH}"}

    msg_ids = []
    loc_driver = get_driver()

    try:
        with loc_driver.session(database="neo4j") as session:
            # EmailGenerator.fetch_msg_ids의 논리를 조정
            # 참고: search_mail.py의 C_type 쿼리 해석:
            # C_type 0: Root (MATCH ()-[r]->() RETURN r.msg_ids) - 매우 광범위하며, 모든 관계의 모든 msg_ids를 가져옴.
            # C_type 1: Person (MATCH (p:Person {contact_id: $cid})-[r]-(root:Root) RETURN r.msg_ids) - Person-Root만.
            # C_type 2: Category (MATCH (c:Category {category_id: $cid})-[r]-(p:Person) RETURN r.msg_ids) - Category-Person만.
            #           in_data (person_ids)가 있는 경우: MATCH (p:Person {contact_id: $pid})-[r]-(c:Category {category_id: $cid})
            # C_type 3: Subcategory (MATCH (s:Subcategory {subcategory_id: $cid})-[r]-(c:Category) RETURN r.msg_ids, r.cids)
            #           in_data (person_ids, category_ids)가 있는 경우: 더 복잡하며, 원래 search_mail.py에는 TODO가 있었음.
            # make_node.py의 그래프 구조는:
            # (Root)-[:INTERACTS_WITH {msg_ids}]->(Person)
            # (Person)-[:HAS_CATEGORY {msg_ids}]->(Category)
            # (Category)-[:HAS_SUBCATEGORY {cids, msg_ids}]->(Subcategory)

            if c_type == 0: # Root 노드 (예: '나' contact_id=0)
                # Root의 INTERACTS_WITH 관계에서 메시지 가져오기
                # search_mail.py는 "MATCH ()-[r]->()"로 너무 광범위함.
                # Root의 basic_c_id가 contact_id (0)이라고 가정
                query = "MATCH (r_node:Root {contact_id: $cid_val})-[rel:INTERACTS_WITH]->(:Person) RETURN rel.msg_ids AS msg_ids_list"
                results = session.run(query, cid_val=basic_c_id)
                for record in results:
                    msg_ids.extend(record.get('msg_ids_list') or [])
            
            elif c_type == 1: # Person 노드
                # INTERACTS_WITH (Root로) 및 HAS_CATEGORY (Category로) 관계에서 메시지 가져오기
                # search_mail.py는 Person-Root만 처리했음. Person에 대해 둘 다 가져옴.
                query1 = "MATCH (:Root)-[rel:INTERACTS_WITH]->(p:Person {contact_id: $cid_val}) RETURN rel.msg_ids AS msg_ids_list"
                results1 = session.run(query1, cid_val=basic_c_id)
                for record in results1:
                    msg_ids.extend(record.get('msg_ids_list') or [])
                
                query2 = "MATCH (p:Person {contact_id: $cid_val})-[rel:HAS_CATEGORY]->(:Category) RETURN rel.msg_ids AS msg_ids_list"
                results2 = session.run(query2, cid_val=basic_c_id)
                for record in results2:
                    msg_ids.extend(record.get('msg_ids_list') or [])

            elif c_type == 2: # Category 노드
                person_ids_filter = None
                if isinstance(in_data, list) and len(in_data) > 0 and isinstance(in_data[0], list) and len(in_data[0]) > 0 : # search_mail.py 형식 [[pids], [cids]]
                    person_ids_filter = in_data[0]
                elif isinstance(in_data, list) and len(in_data) > 0 and not isinstance(in_data[0], list): # search_mail.py 형식 [pids]
                     person_ids_filter = in_data


                if person_ids_filter:
                    # 이 카테고리와 상호작용하는 특정 사람들로 필터링
                    query = """
                        MATCH (p:Person)-[rel:HAS_CATEGORY]->(c:Category {category_id: $cid_val})
                        WHERE p.contact_id IN $pids_filter
                        RETURN rel.msg_ids AS msg_ids_list
                    """
                    results = session.run(query, cid_val=basic_c_id, pids_filter=person_ids_filter)
                else:
                    # 이 카테고리의 모든 메시지 가져오기
                    query = "MATCH (:Person)-[rel:HAS_CATEGORY]->(c:Category {category_id: $cid_val}) RETURN rel.msg_ids AS msg_ids_list"
                    results = session.run(query, cid_val=basic_c_id)
                
                for record in results:
                    msg_ids.extend(record.get('msg_ids_list') or [])

            elif c_type == 3: # Subcategory 노드
                # in_data는 search_mail.py에서 [[person_ids], [category_ids]]로 예상됨
                # 그러나 search_mail.py의 c_type=3 논리는 불완전했음.
                # HAS_SUBCATEGORY 관계는 msg_ids와 cids (부모 카테고리를 통해 관련된 사람들의 contact_ids)를 가짐
                
                # 간단히: 이 subcategory_id에 대한 HAS_SUBCATEGORY 관계에서 모든 msg_ids 가져오기
                # in_data에서 person_ids 또는 category_ids로 필터링이 필요한 경우, 이 쿼리는 더 복잡해야 함.
                # 현재로서는 부모 카테고리를 통해 직접 관련된 메시지를 모두 가져옴.
                
                person_ids_filter = None
                # category_ids_filter = None # Subcat msg_ids 필터링을 위한 관계에서 직접 사용되지 않음.
                # Subcategory는 이미 구체적임.
                if isinstance(in_data, list) and len(in_data) > 0 and isinstance(in_data[0], list) and len(in_data[0]) > 0:
                    person_ids_filter = in_data[0]
                # if isinstance(in_data, list) and len(in_data) > 1 and isinstance(in_data[1], list) and len(in_data[1]) > 0:
                #     category_ids_filter = in_data[1]

                if person_ids_filter:
                    # 이 Subcategory와 관련된 사람들 (rel의 cids)로 필터링된 메시지 가져오기
                    query = """
                        MATCH (:Category)-[rel:HAS_SUBCATEGORY]->(s:Subcategory {subcategory_id: $cid_val})
                        WHERE size([common_cid IN $pids_filter WHERE common_cid IN rel.cids]) > 0
                        RETURN rel.msg_ids AS msg_ids_list
                    """
                    results = session.run(query, cid_val=basic_c_id, pids_filter=person_ids_filter)
                else:
                    query = "MATCH (:Category)-[rel:HAS_SUBCATEGORY]->(s:Subcategory {subcategory_id: $cid_val}) RETURN rel.msg_ids AS msg_ids_list"
                    results = session.run(query, cid_val=basic_c_id)

                for record in results:
                    msg_ids.extend(record.get('msg_ids_list') or [])
            
            unique_msg_ids = list(dict.fromkeys(m_id for m_id in msg_ids if m_id is not None))
            print(f"[Python FetchEmails] Found {len(unique_msg_ids)} unique message IDs from Neo4j.", file=sys.stderr) # stderr로 변경

        if not unique_msg_ids:
            return {"status": "success", "message": "Python: No messages () found for the criteria.", "result": {"emails": []}}

        # SQLite에서 이메일 가져오기
        conn_sqlite = sqlite3.connect(SQLITE_DB_PATH)
        cursor_sqlite = conn_sqlite.cursor()
        placeholders = ','.join('?' for _ in unique_msg_ids)
        sql_query = (
            f"SELECT message_id, thread_id, from_email, from_name, subject, snippet, sent_at, is_read "
            f"FROM Message WHERE message_id IN ({placeholders}) ORDER BY sent_at DESC"
        )
        cursor_sqlite.execute(sql_query, unique_msg_ids)
        rows = cursor_sqlite.fetchall()
        conn_sqlite.close()
        print(f"[Python FetchEmails] Fetched {len(rows)} emails from SQLite.", file=sys.stderr) # stderr로 변경

        emails_result = [
            {
                'message_id': r[0], 'threadId': r[1], 'fromEmail': r[2], 'fromName': r[3],
                'subject': r[4], 'snippet': r[5], 'sentAt': r[6], 'isRead': bool(r[7])
            } for r in rows
        ]
        return {"status": "success", "message": "Python: Messages () fetched successfully.", "result": {"emails": emails_result}}

    except neo4j.exceptions.Neo4jError as e:
        print(f"[Python FetchEmails] Neo4jError: {e}", file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: Neo4jError fetching emails () - {str(e)}"}
    except sqlite3.Error as e:
        print(f"[Python FetchEmails] SQLite error: {e}", file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: SQLite error fetching emails () - {str(e)}"}
    except Exception as e:
        print(f"[Python FetchEmails] Error fetching emails (): {str(e)}", file=sys.stderr) # stderr로 변경
        traceback.print_exc(file=sys.stderr) # stderr로 변경
        return {"status": "error", "message": f"Python: Error fetching emails () - {str(e)}"}

def read_node_py(c_id, c_type, io_type):
    try:
        loc_driver = get_driver()
        label = LABEL_MAP_SN.get(c_type)
        if not label:
            return {"status": "error", "message": f"Python: Invalid C_type {c_type}"}

        prop_name = 'contact_id' if c_type in (0, 1) else 'category_id' if c_type == 2 else 'subcategory_id'

        with loc_driver.session() as session:
            center_node_query = f"MATCH (n:{label} {{{prop_name}: $cid}}) RETURN n.name AS name, n.{prop_name} AS id_val"
            center_rec = session.run(center_node_query, cid=c_id).single()

            if not center_rec:
                return {"status": "error", "message": f"Python: Node {label} with {prop_name}={c_id} not found."}
            
            center_name, center_id_val = center_rec['name'], center_rec['id_val']
            
            nodes_result = [{'id': 0, 'C_ID': center_id_val, 'C_type': c_type, 'data': {'label': center_name}}]
            seen_names = {center_name}
            idx = 1

            if io_type == 1: # incoming
                rel_pattern = f"(x)-[]->(n:{label} {{{prop_name}: $cid}})"
            elif io_type == 2: # outgoing
                rel_pattern = f"(n:{label} {{{prop_name}: $cid}})-[]->(x)"
            else: # both
                rel_pattern = f"(x)-[]-(n:{label} {{{prop_name}: $cid}})"
            
            neighbor_query = (
                f"MATCH {rel_pattern} "
                "RETURN DISTINCT x.name AS name, labels(x) AS labs, "
                "x.contact_id AS contact_id, x.category_id AS category_id, x.subcategory_id AS subcategory_id"
            )
            rows = session.run(neighbor_query, cid=c_id).data()

            for r in rows:
                name = r['name']
                if name in seen_names or name is None: # Skip if name is None or already seen
                    continue
                seen_names.add(name)
                
                labs = r.get('labs') or []
                node_c_type, node_c_id = 0, None # Default

                if 'Person' in labs:
                    node_c_type, node_c_id = CTYPE_MAP_SN.get('Person', 1), r['contact_id']
                elif 'Root' in labs: # Root might also have contact_id if it's 0
                     node_c_type, node_c_id = CTYPE_MAP_SN.get('Root', 0), r.get('contact_id')
                elif 'Category' in labs:
                    node_c_type, node_c_id = CTYPE_MAP_SN.get('Category', 2), r['category_id']
                elif 'Subcategory' in labs:
                    node_c_type, node_c_id = CTYPE_MAP_SN.get('Subcategory', 3), r['subcategory_id']
                
                nodes_result.append({'id': idx, 'C_ID': node_c_id, 'C_type': node_c_type, 'data': {'label': name}})
                idx += 1
        return {"status": "success", "message": "Python: Nodes fetched successfully.", "result": {"nodes": nodes_result}}
    except Exception as e:
        return {"status": "error", "message": f"Python: Error reading node: {str(e)}"}

def read_message_py(basic_c_id, c_type, filter_data):
    try:
        io_type = filter_data.get("io_type")
        in_data = filter_data.get("in_data") # c_type=3의 경우 [[person_ids], [category_ids]] 형식으로 예상됨

        loc_driver = get_driver()
        msg_ids = []
        with loc_driver.session() as session:
            # 이 논리는 복잡하며 EmailGenerator.fetch_msg_ids에서 조정됨
            if c_type == 0: # Root - 모든 메시지 (매우 클 수 있음)
                # 단순화: 일부 메시지 가져오기 또는 Root에 대한 특정 논리 정의
                # 현재로서는 '나' (Root)와 관련된 메시지라고 가정
                for rec in session.run("MATCH (r:Root {name:'나'})-[rel:INTERACTS_WITH]-() RETURN rel.msg_ids AS msg_ids"):
                    msg_ids.extend(rec.get('msg_ids') or [])
            elif c_type == 1: # Person
                for rec in session.run(
                    "MATCH (p:Person {contact_id: $cid})-[r]-(:Root) RETURN r.msg_ids AS msg_ids", cid=basic_c_id
                ):
                    msg_ids.extend(rec.get('msg_ids') or [])
                for rec in session.run(
                    "MATCH (p:Person {contact_id: $cid})-[r]-(:Category) RETURN r.msg_ids AS msg_ids", cid=basic_c_id
                ):
                    msg_ids.extend(rec.get('msg_ids') or [])
            elif c_type == 2: # Category
                # in_data에 person_ids가 포함될 수 있음
                person_ids_filter = in_data.get('person_ids') if isinstance(in_data, dict) else (in_data[0] if isinstance(in_data, list) and len(in_data)>0 else None)
                if person_ids_filter:
                    for pid in person_ids_filter:
                        for rec in session.run(
                            "MATCH (p:Person {contact_id: $pid})-[r]-(c:Category {category_id: $cid}) RETURN r.msg_ids AS msg_ids",
                            pid=pid, cid=basic_c_id
                        ):
                            msg_ids.extend(rec.get('msg_ids') or [])
                else: # 사람 필터가 없으면 이 카테고리의 모든 메시지 가져오기
                    for rec in session.run(
                        "MATCH (c:Category {category_id: $cid})-[r]-(p:Person) RETURN r.msg_ids AS msg_ids", cid=basic_c_id
                    ):
                        msg_ids.extend(rec.get('msg_ids') or [])
            elif c_type == 3: # Subcategory
                # in_data: [[person_ids], [category_ids]]
                person_ids_filter = in_data[0] if isinstance(in_data, list) and len(in_data) > 0 else None
                # category_ids_filter = in_data[1] if isinstance(in_data, list) and len(in_data) > 1 else None # Subcat msg_ids 필터링을 위한 관계에서 직접 사용되지 않음

                # Subcategory에 대한 search_mail.py의 논리는 카테고리와의 관계를 찾은 다음 관계의 cids를 확인하는 것이었음
                # 현재로서는 간단히 해석함.
                # 원래 search_mail.py의 c_type=3 논리는 매우 복잡했음.
                # 이 부분은 search_mail.py에서 원하는 정확한 동작에 대해 신중히 검토해야 함.
                query = """
                MATCH (s:Subcategory {subcategory_id: $cid})<-[r_sc:HAS_SUBCATEGORY]-(cat:Category)
                OPTIONAL MATCH (p:Person)-[r_pc:HAS_CATEGORY]->(cat)
                WHERE ($pids IS NULL OR p.contact_id IN $pids)
                WITH r_sc, r_pc
                UNWIND (coalesce(r_sc.msg_ids, []) + coalesce(r_pc.msg_ids, [])) AS msg_id
                RETURN DISTINCT msg_id
                """
                results = session.run(query, cid=basic_c_id, pids=person_ids_filter)
                for rec in results:
                    msg_ids.append(rec["msg_id"])

            unique_msg_ids = list(dict.fromkeys(m_id for m_id in msg_ids if m_id is not None))

        if not unique_msg_ids:
            return {"status": "success", "message": "Python: No messages found for the criteria.", "result": {"messages": []}}

        # SQLite에서 이메일 가져오기
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        placeholders = ','.join('?' for _ in unique_msg_ids)
        sql = (
            f"SELECT message_id, thread_id, from_email, from_name, subject, snippet, sent_at, is_read "
            f"FROM Message WHERE message_id IN ({placeholders}) ORDER BY sent_at DESC"
        )
        cursor.execute(sql, unique_msg_ids)
        rows = cursor.fetchall()
        conn.close()

        emails = [
            {
                'message_id': r[0], 'threadId': r[1], 'fromEmail': r[2], 'fromName': r[3],
                'subject': r[4], 'snippet': r[5], 'sentAt': r[6], 'isRead': bool(r[7])
            } for r in rows
        ]
        return {"status": "success", "message": "Python: Messages fetched successfully.", "result": {"messages": emails}}
    except Exception as e:
        return {"status": "error", "message": f"Python: Error reading messages: {str(e)}"}

def delete_node_py(node_id): # delete_node_if_empty에 해당
    try:
        # node_id가 modify_node.py에서 사용된 'id' 속성이라고 가정
        # 이 함수는 일반적인 'Node' 레이블과 'id' 속성을 예상함.
        # 노드에 특정 레이블과 ID 속성(예: Person의 contact_id)이 있는 경우 조정이 필요할 수 있음
        # 현재로서는 일반적인 'id' 속성을 가정합니다. C_ID가 전달되면 내부 DB ID일 수 있습니다.
        # graphController의 원래 deleteNode는 'nodeId'만 전달합니다.
        # nodeId가 노드의 고유 식별자 속성이라고 가정합니다.
        query = """
        MATCH (n) WHERE n.id = $node_id OR id(n) = $node_id_int
        OPTIONAL MATCH (n)-[r]-()
        WITH n, count(r) as rel_count
        WHERE rel_count = 0 // 또는 delete_node_if_empty의 특정 로직
        DETACH DELETE n
        RETURN count(n) as deleted_count
        """
        # id(n)과 일치시키기 위해 숫자 문자열인 경우 nodeId를 int로 변환 시도
        node_id_int = -1
        try:
            node_id_int = int(node_id)
        except ValueError:
            pass

        result = _execute_query(query, params={"node_id": node_id, "node_id_int": node_id_int}).single()
        deleted_count = result["deleted_count"] if result else 0

        if deleted_count > 0:
            return {"status": "success", "message": f"Python: Node '{node_id}' deleted successfully.", "result": {"deletedNodeId": node_id}}
        else:
            # 이 부분은 "delete_node_if_empty"의 정확한 논리가 더 복잡한 경우 필요
            # modify_node.py의 쿼리는:
            # MATCH (n:Node {id: $a_id}) OPTIONAL MATCH (n)-[r]-()
            # WITH n, collect(r) AS rels, collect(CASE WHEN startNode(r).id = $a_id THEN endNode(r).id ELSE startNode(r).id END) AS linked_ids, keys(n) AS node_keys
            # WITH n, node_keys, linked_ids, reduce(s = [], x IN linked_ids | CASE WHEN x IN s THEN s ELSE s + [x] END) AS unique_ids
            # WHERE size(unique_ids) = 1 AND all(key IN node_keys WHERE key = 'id') DETACH DELETE n
            # 이는 node_id가 항상 'id' 속성만 있는 :Node에 해당하는 경우에만 너무 구체적임.
            # 현재로서는 더 간단한 "관계가 없는 경우 삭제"가 위에 구현됨.
            return {"status": "success", "message": f"Python: Node '{node_id}' not deleted (either not found or has relationships/failed conditions).", "result": {"deletedNodeId": None}}
    except Exception as e:
        return {"status": "error", "message": f"Python: Error deleting node '{node_id}': {str(e)}"}

def merge_node_py(from_c_id, to_c_id): # merge_nodes_to_new에 해당
    try:
        # from_c_id와 to_c_id가 공통 'id' 속성(예: 'name' 또는 'unique_id')의 값이라고 가정
        # 원본 스크립트는 일반적인 :Node {id: ...}를 사용했음
        # ID가 특정된 경우(예: :Person의 contact_id) 이에 맞게 수정해야 함
        # 단순화를 위해 병합 시 'name' 속성을 사용한다고 가정
        # 새 노드의 이름은 from_c_id + "_" + to_c_id가 됨

        new_node_id = f"{from_c_id}_{to_c_id}"
        query = """
        MATCH (a {name: $from_id}), (b {name: $to_id})
        WHERE id(a) <> id(b)
        CALL apoc.refactor.mergeNodes([a,b], {properties: 'combine', mergeRels: true}) YIELD node
        SET node.name = $new_id
        RETURN node.name as merged_node_name
        """
        # APOC를 사용합니다. APOC를 사용할 수 없는 경우 modify_node.py의 수동 병합 로직이 필요합니다.
        # modify_node.py의 수동 병합 로직 (APOC를 사용할 수 없거나 원치 않는 경우):
        # MERGE (c:Node {id: $new_node_id_val})
        # WITH a, b, c
        # CALL { WITH a, c, b MATCH (a)-[r]->(x) WHERE x <> b MERGE (c)-[new_r:REL]->(x) SET new_r = r }
        # CALL { WITH a, c, b MATCH (x)-[r]->(a) WHERE x <> b MERGE (x)-[new_r:REL]->(c) SET new_r = r }
        # CALL { WITH b, c, a MATCH (b)-[r]->(x) WHERE x <> a MERGE (c)-[new_r:REL]->(x) SET new_r = r }
        # CALL { WITH b, c, a MATCH (x)-[r]->(b) WHERE x <> a MERGE (x)-[new_r:REL]->(c) SET new_r = r }
        # DETACH DELETE a,b
        # RETURN c.id as merged_node_name
        # 현재는 간결성을 위해 APOC를 가정합니다. 필요한 경우 수동 로직으로 대체하십시오.
        
        result = _execute_query(query, params={"from_id": from_c_id, "to_id": to_c_id, "new_id": new_node_id}).single()
        if result and result["merged_node_name"]:
            return {"status": "success", "message": f"Python: Nodes '{from_c_id}' and '{to_c_id}' merged into '{result['merged_node_name']}'.", "result": {"mergedNodeId": result["merged_node_name"]}}
        else:
            # 노드가 존재하는지 확인
            check_query = "MATCH (n {name: $id}) RETURN count(n) as count"
            count_from = _execute_query(check_query, params={"id": from_c_id}).single()["count"]
            count_to = _execute_query(check_query, params={"id": to_c_id}).single()["count"]
            if count_from == 0 or count_to == 0:
                 return {"status": "error", "message": f"Python: One or both nodes for merging not found ('{from_c_id}', '{to_c_id}')."}
            if from_c_id == to_c_id:
                 return {"status": "error", "message": f"Python: Cannot merge a node with itself ('{from_c_id}')."}

            return {"status": "error", "message": f"Python: Failed to merge nodes '{from_c_id}' and '{to_c_id}'. They might be the same or not found."}

    except Exception as e:
        return {"status": "error", "message": f"Python: Error merging nodes: {str(e)}"}

def update_label_py(c_id, new_label_name): # c_id는 식별자, new_label_name은 새 이름/레이블 값
    try:
        # c_id가 고유 속성 값(예: contact_id, category_id 또는 일반 'id')이라고 가정
        # 그리고 'name' 속성을 업데이트한다고 가정
        # 어떤 속성이 노드를 식별하고 어떤 속성을 업데이트할지 알아야 함.
        # 'id_prop' 속성(contact_id 등일 수 있음)으로 일치시키고 'name'을 설정한다고 가정
        # 이것은 추측입니다. JS 측에서는 C_ID와 newLabel을 보냅니다.
        # 고유 ID 중 하나로 식별되는 노드의 'name' 속성을 업데이트하려고 시도합니다.
        
        # 공통 ID 속성으로 노드를 찾아 'name'을 업데이트 시도
        # 이것은 일반적인 시도이며, 특정 노드 유형에는 다른 ID 속성이 필요할 수 있습니다.
        query = """
        MATCH (n)
        WHERE n.contact_id = $id_val OR n.category_id = $id_val OR n.subcategory_id = $id_val OR n.name = $id_val_str OR n.id = $id_val_str
        SET n.name = $new_name
        RETURN count(n) as updated_count
        """
        id_val_int = None
        try:
            id_val_int = int(c_id)
        except ValueError: # c_id가 순수 정수가 아닌 경우
            pass

        params = {"id_val": id_val_int if id_val_int is not None else c_id, "id_val_str": str(c_id), "new_name": new_label_name}
        result = _execute_query(query, params=params).single()
        
        if result and result["updated_count"] > 0:
            return {"status": "success", "message": f"Python: Node identified by '{c_id}' updated with new name/label '{new_label_name}'.", "result": {"updatedNodeId": c_id, "newName": new_label_name}}
        else:
            return {"status": "error", "message": f"Python: Node identified by '{c_id}' not found or no update occurred."}
    except Exception as e:
        return {"status": "error", "message": f"Python: Error updating node label/name: {str(e)}"}

def get_incoming_nodes_py(node_name_param):
    try:
        # modify_node.py의 show_incoming_nodes에서 가져왔으며, node_name_param이 'name' 속성이라고 가정
        query = """
        MATCH (x)-[]->(n {name: $name_val})
        WHERE x.name IS NOT NULL
        RETURN DISTINCT x.name AS name, labels(x) as labels,
               x.contact_id as contact_id, x.category_id as category_id, x.subcategory_id as subcategory_id
        ORDER BY x.name
        """
        results = _execute_query(query, params={"name_val": node_name_param}).data()
        nodes = []
        for record in results:
            node_details = {"name": record["name"], "labels": record["labels"]}
            # Add C_ID and C_type based on labels
            c_type, c_id = None, None
            if "Person" in record["labels"]:
                c_type = CTYPE_MAP_SN.get("Person")
                c_id = record["contact_id"]
            elif "Category" in record["labels"]:
                c_type = CTYPE_MAP_SN.get("Category")
                c_id = record["category_id"]
            elif "Subcategory" in record["labels"]:
                c_type = CTYPE_MAP_SN.get("Subcategory")
                c_id = record["subcategory_id"]
            elif "Root" in record["labels"]:
                c_type = CTYPE_MAP_SN.get("Root")
                c_id = record.get("contact_id") # Root는 contact_id = 0일 수 있음
            node_details["C_ID"] = c_id
            node_details["C_type"] = c_type
            nodes.append(node_details)

        return {"status": "success", "message": f"Python: Incoming nodes for '{node_name_param}' fetched.", "result": {"nodes": nodes}}
    except Exception as e:
        return {"status": "error", "message": f"Python: Error fetching incoming nodes: {str(e)}"}

def delete_all_nodes_py():
    try:
        _execute_query("MATCH (n) DETACH DELETE n")
        return {"status": "success", "message": "Python: All nodes and relationships deleted."}
    except Exception as e:
        return {"status": "error", "message": f"Python: Error deleting all nodes: {str(e)}"}

def move_complex_node_py(a_id, b_id, c_id): # modify_node.py의 move_node에서 가져옴
    try:
        # modify_node.py에서처럼 :Node 레이블과 'id' 속성을 가정함
        # 이것은 복잡한 작업이며 특정 그래프 모델에 대한 조정이 필요할 수 있음
        # modify_node.py의 쿼리는 매우 구체적이며 새로운 관계를 생성함.
        # 현재 이것은 해당 복잡한 로직을 위한 플레이스홀더임.
        # 전체 구현에는 Cypher의 신중한 포팅이 필요함.
        raise NotImplementedError(f"Python: move_complex_node_py({a_id}, {b_id}, {c_id}) is not yet implemented.")
    except Exception as e:
        return {"status": "error", "message": f"Python: Error in move_complex_node: {str(e)}"}

def test_connection():
    try:
        # 여기에 실제 Neo4j 드라이버 연결 테스트 로직을 추가할 수 있습니다.
        # 예시로 간단히 성공 응답을 반환합니다.
        get_driver() # 드라이버 초기화 시도
        close_driver() # 테스트 후 드라이버 닫기 (선택 사항)
        return {"status": "success", "message": "Python: Neo4j connection test successful."}
    except Exception as e:
        return {"status": "error", "message": f"Python: Neo4j connection test failed: {str(e)}"}

if __name__ == "__main__":
    raw_input_data = ""
    try:
        raw_input_data = sys.stdin.read()
        if not raw_input_data:
            print(json.dumps({"status": "error", "message": "Python: No input received"}), file=sys.stderr)
            sys.exit(1)

        input_data = json.loads(raw_input_data)
        operation = input_data.get("operation")
        args = input_data.get("args", {})
        result = None

        if operation == "testConnection":
            result = test_connection()
        elif operation == "initializeGraphFromSQLite":
            result = initialize_graph_from_sqlite_py()
        elif operation == "deleteNode":
            result = delete_node_py(args.get("nodeId"))
        elif operation == "readNode":
            result = read_node_py(args.get("C_ID"), args.get("C_type"), args.get("IO_type"))
        elif operation == "readMessage":
            filter_arg = args.get("filter") if args.get("filter") is not None else {"io_type": args.get("IO_type"), "in_data": args.get("in_data")}
            result = read_message_py(args.get("basic_C_ID"), args.get("C_type"), filter_arg)
        elif operation == "updateLabel":
            result = update_label_py(args.get("C_ID"), args.get("newLabel"))
        elif operation == "mergeNode":
            result = merge_node_py(args.get("from_C_ID"), args.get("to_C_ID"))
        elif operation == "getIncomingNodes":
            result = get_incoming_nodes_py(args.get("node_name"))
        elif operation == "deleteAllNodes":
            result = delete_all_nodes_py()
        elif operation == "moveComplexNode":
            result = move_complex_node_py(args.get("a_id"), args.get("b_id"), args.get("c_id"))
        elif operation == "processAndEmbedMessages":
            result = process_and_embed_messages_py()
        elif operation == "buildGraph":
            result = build_graph_py()
        elif operation == "fetchNodes": #  함수의 새로운 작업 이름
            result = fetch_nodes_py(args.get("C_ID"), args.get("C_type"), args.get("IO_type"))
        elif operation == "fetchEmails": #  함수의 새로운 작업 이름
            result = fetch_emails_py(args.get("basic_C_ID"), args.get("C_type"), args.get("IO_type"), args.get("in_data"))
        else:
            result = {"status": "error", "message": f"Python: Unknown operation '{operation}'"}

        print(json.dumps(result))
        sys.stdout.flush()
        sys.exit(0) # Ensure a zero exit code on successful completion of the try block

    except json.JSONDecodeError as e:
        err_msg = {"status": "error", "message": f"Python: Invalid JSON input - {str(e)}. Received: {raw_input_data[:500]}"}
        print(json.dumps(err_msg), file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)
    except Exception as e:
        operation_name = "unknown"
        if 'input_data' in locals() and isinstance(input_data, dict):
            operation_name = input_data.get('operation', 'unknown_in_dict')
        
        detailed_error_message = traceback.format_exc()
        err_msg = {"status": "error", 
                   "message": f"Python: An error occurred in operation '{operation_name}' - {str(e)}",
                   "trace": detailed_error_message}
        print(json.dumps(err_msg), file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)
    finally:
        close_driver() # Ensure driver is closed if it was opened
