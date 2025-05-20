import sys
import json
from neo4j import GraphDatabase
from neo4j.exceptions import AuthError, ServiceUnavailable
import sqlite3
import os
import sqlite3
from bs4 import BeautifulSoup
import joblib
import torch
from sentence_transformers import SentenceTransformer
import time
import tracemalloc
import re

# --- Configuration ---
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASS = "message-gustav-rufus-alex-roman-2104" # From other scripts
FINAL_MAP_PATH = "final_name_map.json"

# Determine the absolute path to the script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))
# Construct the absolute path to editemaildb.sqlite
SQLITE_DB_PATH = os.path.abspath(os.path.join(script_dir, "..", "..", "..", "..", "emaildb.sqlite"))
print(f"[Python] SQLITE_DB_PATH: {SQLITE_DB_PATH}")


# From search_node.py (for read_node_py)
LABEL_MAP_SN = {0: 'Root', 1: 'Person', 2: 'Category', 3: 'Subcategory'}
CTYPE_MAP_SN = {v: k for k, v in LABEL_MAP_SN.items()}

# embedding 부분 - sqlite가 만들어졌다면 바로 실행(category 생성)
def process_and_embed_messages_py(DB_PATH=SQLITE_DB_PATH):
    # --- 측정 시작 ---
    total_start = time.time()
    tracemalloc.start()

    # --- 모델 로드 ---
    clf = joblib.load("xgb_model_384to64_miniLM.pkl")
    pca = joblib.load("pca_64_from_384_miniLM.pkl")
    le = joblib.load("label_encoder_384to64_miniLM.pkl")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"✅ SBERT device: {device}")
    sbert = SentenceTransformer("sbert_model_miniLM.pkl", device=device)

    # --- HTML → 텍스트 변환 함수 ---
    def html_to_text(html: str) -> str:
        if not html:
            return ''
        return BeautifulSoup(html, 'html.parser').get_text(separator='\n', strip=True)

    # --- 조직명 추출 도구 ---
    org_keywords = [
        "대학교", "대학", "캠퍼스", "학교", "중학교", "고등학교",
        "전자", "자동차", "화학", "건설", "통신", "제약", "바이오",
        "연구소", "인사팀", "그룹", "센터", "병원", "협회", "기관"
    ]
    org_pattern = re.compile(r"(?:\(?주\)?식회사|\(?주\)|㈜)[\s]*([가-힣A-Za-z0-9&·]+)")

    def extract_signature(text):
        tail = text[-300:]
        blocks = [tail[i:i+50] for i in range(0, len(tail), 50)]
        org_lines = []
        for line in blocks:
            if any(kw in line for kw in org_keywords) or org_pattern.search(line):
                org_lines.append(line)
        return org_lines

    def extract_organization(org_lines):
        for line in org_lines:
            match = org_pattern.search(line)
            if match:
                return match.group(1).strip()
        return None

    # --- 룰 기반 분류 ---
    RULES = [
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
        ("문의드립니다", "회사:업무"),
        ("회신 부탁", "회사:업무"),
        ("회의 요청", "회사:일정"),
        ("미팅 일정", "회사:일정"),
        ("자료 요청", "회사:업무"),
        ("보고서", "회사:업무"),
        ("협조 요청", "회사:업무"),
        ("Jira", "JIRA"),
    ]

    def apply_rules(text: str) -> str | None:
        for keyword, label in RULES:
            if keyword in text:
                return label
        return None

    def predict_label(text: str) -> str:
        emb = sbert.encode([text])
        emb_pca = pca.transform(emb)
        pred_num = clf.predict(emb_pca)[0]
        return le.inverse_transform([pred_num])[0]

    # --- DB 연결 ---
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # --- Category 캐시 ---
    cur.execute("SELECT category_id, category_name FROM Category;")
    category_cache = {name: cid for cid, name in cur.fetchall()}

    def get_or_create_category_id(name: str) -> int:
        name = name.strip()
        if name in category_cache:
            return category_cache[name]
        cur.execute("INSERT INTO Category (category_name) VALUES (?);", (name,))
        cid = cur.lastrowid
        category_cache[name] = cid
        return cid

    # --- body_html → body_text 변환 및 저장 ---
    cur.execute("SELECT rowid, body_html FROM Message;")
    rows = cur.fetchall()
    text_updates = [(html_to_text(html), rowid) for rowid, html in rows]
    cur.executemany(
        "UPDATE Message SET body_text = ? WHERE rowid = ?;",
        text_updates
    )
    conn.commit()

    # --- 메시지 조회 및 분류 준비 ---
    cur.execute("SELECT message_id, body_text FROM Message;")
    messages = cur.fetchall()

    updates = []
    for mid, text in messages:
        if not text or not text.strip():
            continue
        plain_text = text
        org_lines = extract_signature(plain_text)
        org_name = extract_organization(org_lines)
        base_label = apply_rules(plain_text) or predict_label(plain_text)
        if org_name and ":" in base_label:
            _, sub = base_label.split(":", 1)
            cat = org_name
        elif ":" in base_label:
            cat, sub = base_label.split(":", 1)
        else:
            cat, sub = base_label, None
        cat_id = get_or_create_category_id(cat)
        sub_id = get_or_create_category_id(sub) if sub else None
        updates.append((cat_id, sub_id, mid))

    # --- DB 업데이트 ---
    cur.executemany(
        "UPDATE Message SET category_id=?, sub_category_id=? WHERE message_id=?;",
        updates
    )
    conn.commit()
    conn.close()

    # --- 측정 종료 ---
    total_end = time.time()
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    print(f"✅ 총 {len(updates)}개 메시지 분류 완료")
    print(f"⏱️ 처리 시간: {total_end - total_start:.2f}초")
    print(f"💾 메모리 사용: 현재 {current/1024/1024:.2f}MB / 최대 {peak/1024/1024:.2f}MB")

# --- Function from make_node.py ---
# graphdb 생성 - embedding 이후에 바로 실행
def resolve_final_name(name, mapping):
    visited = set()
    while name in mapping and name not in visited:
        visited.add(name)
        name = mapping[name]
    return name

def initialize_graph_from_sqlite_py():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT email FROM Account;")
    account_emails = [row[0].lower() for row in cur.fetchall()]

    cur.execute("SELECT message_id, category_id, sub_category_id FROM Message;")
    messages = cur.fetchall()

    msg_contacts = {}
    cur.execute("SELECT message_id, contact_id, type FROM MessageContact;")
    for mid, cid, typ in cur.fetchall():
        msg_contacts.setdefault(mid, {}).setdefault(typ, []).append(cid)

    cur.execute("SELECT contact_id, name, email FROM EmailContact;")
    email_contacts = {cid: (name, email.lower()) for cid, name, email in cur.fetchall()}

    cur.execute("SELECT category_id, category_name FROM Category;")
    category_map = {cid: name for cid, name in cur.fetchall()}

    conn.close()

    if os.path.exists(FINAL_MAP_PATH):
        final_name_map = json.load(open(FINAL_MAP_PATH, encoding="utf-8"))
    else:
        final_name_map = {}

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    with driver.session() as sess:
        sess.run("MATCH (n) DETACH DELETE n")

        sess.run("""
            MERGE (root:Root {name: '나'})
            ON CREATE SET root.emails = $emails,
                          root.contact_id = 0
        """, emails=account_emails)

        for msg_id, cat_id, subcat_id in messages:
            raw_category_name = category_map.get(cat_id)
            raw_subcategory_name = category_map.get(subcat_id) if subcat_id is not None else None

            category_name = resolve_final_name(raw_category_name, final_name_map)
            subcategory_name = resolve_final_name(raw_subcategory_name, final_name_map) if raw_subcategory_name else None

            contacts = msg_contacts.get(msg_id, {})
            recips = [
                cid for cid in contacts.get('TO', [])
                if email_contacts.get(cid, ('', ''))[1] not in account_emails
            ]
            if not recips:
                recips = contacts.get('FROM', [])

            for cid in recips:
                name, _ = email_contacts.get(cid, (None, None))
                if not name:
                    continue
                name = resolve_final_name(name, final_name_map)

                sess.run("""
                    MATCH (root:Root {name: '나'})
                    MERGE (p:Person {name: $name})
                      SET p.contact_id = $cid
                    MERGE (root)-[r1:INTERACTS_WITH]->(p)
                    SET r1.msg_ids = coalesce(r1.msg_ids, []) + [$msg_id]

                    MERGE (c:Category {name: $category_name})
                    MERGE (p)-[r2:HAS_CATEGORY]->(c)
                    SET
                      r2.msg_ids    = coalesce(r2.msg_ids, []) + [$msg_id],
                      c.category_id = $category_id

                    WITH c, $subcategory_name AS subcat, $cid AS cid, $msg_id AS mid, $subcategory_id AS scid
                    WHERE subcat IS NOT NULL
                    MERGE (s:Subcategory {name: subcat})
                    MERGE (c)-[sr:HAS_SUBCATEGORY]->(s)
                    SET
                      sr.cids         = coalesce(sr.cids, []) + [cid],
                      sr.msg_ids      = coalesce(sr.msg_ids, []) + [mid],
                      s.subcategory_id = scid
                """, {
                    'name':             name,
                    'cid':              cid,
                    'msg_id':           msg_id,
                    'category_name':    category_name,
                    'category_id':      cat_id,
                    'subcategory_name': subcategory_name,
                    'subcategory_id':   subcat_id or 0
                })

    driver.close()
    print("✅ 그래프 생성 완료.")

# --- Function from search_node.py (for read_node_py) ---
# 주변 노드 조회 - front에서 해당 노드 주변의 노드를 요청할때 실행
"""
front에서 전달해야 하는 json 형태
{
    "C_ID": 중심 노드 ID,
    "C_type": 중심 노드 타입,
    "IO_type": inout 타입 
}
중심 노드 타입 - 0 : Root, 1 : Person, 2 : Category, 3 : Subcategory
중심 노드 ID - Root, Person : contact_id, Category, Subcategory : category_id
inout 타입 - 1 : in, 2 : out, 3 : in&out
front로 전달하는 json 형태
{
  "status": "success" or "fail",
  "message": "nodes fetched",
  "result": {
    "nodes": [
      {
        "id": 중심 확인용 노드 ID
        "C_ID": 노드 ID,
        "C_type": 노드 타입입,
        "data": {
          "label": 노드드 이름
        },
        "count": 메세지 갯수
      },
    ]
  }
}
중심 확인용 노드 ID - 0 : 중심 노드, 외에는 graphdb의 id라 의미가 없음
노드 ID - Root, Person : contact_id, Category, Subcategory : category_id
메세지 갯수를 가지고 내림차순으로 정렬
"""
LABEL_MAP = {0: 'Root', 1: 'Person', 2: 'Category', 3: 'Subcategory'}
CTYPE_MAP = {v: k for k, v in LABEL_MAP.items()}

def read_node_py(json_obj):
    try:
        c_id = json_obj["C_ID"]
        c_type = json_obj["C_type"]
        io_type = json_obj["IO_type"]
    except KeyError as e:
        return {'status': 'fail', 'message': f'입력 JSON에 필드 누락: {e}', 'result': {}}

    label = LABEL_MAP[c_type]
    prop = 'contact_id' if c_type in (0, 1) else 'category_id' if c_type == 2 else 'subcategory_id'

    if io_type == 1:
        rel_pattern = f"(x)-[r]->(n:{label} {{{prop}: $cid}})"
    elif io_type == 2:
        rel_pattern = f"(n:{label} {{{prop}: $cid}})-[r]->(x)"
    else:
        rel_pattern = f"(x)-[r]-(n:{label} {{{prop}: $cid}})"

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    try:
        with driver.session() as session:
            # 중심 노드 조회
            rec = session.run(
                f"MATCH (n:{label} {{{prop}: $cid}}) RETURN n.name AS name, n.{prop} AS cid",
                cid=c_id
            ).single()
            if not rec:
                raise ValueError(f"{label} with {prop}={c_id} not found")
            center_name, center_cid = rec['name'], rec['cid']
            nodes = [{
                'id': 0,
                'C_ID': center_cid,
                'C_type': c_type,
                'data': {'label': center_name},
                'count': 0
            }]
            seen = {center_name}

            # 이웃 노드 조회
            query = (
                f"MATCH {rel_pattern} "
                "WITH x, r, labels(x) AS labs "
                "RETURN x.name AS name, labs, "
                "x.contact_id AS contact_id, x.category_id AS category_id, x.subcategory_id AS subcategory_id, "
                "size(coalesce(r.msg_ids, [])) AS count"
            )
            rows = session.run(query, cid=c_id).data()

            idx = 1
            neighbors = []
            for r in rows:
                name = r['name']
                if name in seen:
                    continue
                seen.add(name)
                labs = r.get('labs') or []

                if 'Person' in labs or 'Root' in labs:
                    nb_type, nb_cid = CTYPE_MAP.get(labs[0], 0), r['contact_id']
                elif 'Category' in labs:
                    nb_type, nb_cid = 2, r['category_id']
                elif 'Subcategory' in labs:
                    nb_type, nb_cid = 3, r['subcategory_id']
                else:
                    nb_type, nb_cid = 0, None

                neighbors.append({
                    'id': idx,
                    'C_ID': nb_cid,
                    'C_type': nb_type,
                    'data': {'label': name},
                    'count': r.get('count', 0)
                })
                idx += 1

        neighbors.sort(key=lambda x: x['count'], reverse=True)
        nodes.extend(neighbors)

        # result = {
        #     'status': 'success',
        #     'message': 'nodes fetched',
        #     'result': {'nodes': nodes}
        # }
        # print(json.dumps(result, ensure_ascii=False, indent=2))
        return {'status': 'success', 'message': 'nodes fetched', 'result': {'nodes': nodes}}

    except Exception as e:
        return {'status': 'fail', 'message': str(e), 'result': {}}
    finally:
        driver.close()

# 해당 노드 메세지 조회 - front에서 해당 노드의 메세지지를 요청할때 실행
"""
front에서 전달해야 하는 json 형태
{
    "C_ID": 중심 노드 ID,
    "C_type": 중심 노드 타입,
    "IO_type": inout 타입 - 항싱 1
    "In": [주변 노드 ID 리스트]
}
중심 노드 타입 - 0 : Root, 1 : Person, 2 : Category, 3 : Subcategory
중심 노드 ID - Root, Person : contact_id, Category, Subcategory : category_id
inout 타입 - 1 : in, 2 : out, 3 : in&out
주변 노드 ID 리스트 - Root, Person : [], Category: [Person ID], Subcategory: [[Person의  C_ID], [Category의 C_ID]]
front로 전달하는 json 형태
{
  "status": "success" or "fail",
  "message": "emails fetched",
  "result": {
    "emails": [
      {
        "message_id": 메세지 ID,
        "threadId": Thread ID,
        "fromEmail": From Email,
        "fromName": From Name,
        "subject": Subject,
        "snippet": Snippet,
        "sentAt": 보낸 날짜,
        "isRead": 읽었는지 확인 - true or false
      },
    ]
  }
}
"""
def read_message_py(json_obj):
    try:
        c_id     = json_obj["C_ID"]
        c_type   = json_obj["C_type"]
        io_type  = json_obj["IO_type"]
        in_data  = json_obj.get("In", None)
    except KeyError as e:
        result = {'status': 'fail', 'message': f'입력 JSON에 필드 누락: {e}', 'result': {}}
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return result

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    conn = sqlite3.connect(SQLITE_DB_PATH)

    try:
        ids = []
        with driver.session() as session:
            if c_type == 0:
                for rec in session.run("MATCH ()-[r]->() RETURN r.msg_ids AS msg_ids"):
                    ids.extend(rec.get('msg_ids') or [])
            elif c_type == 1:
                for rec in session.run(
                    "MATCH (p:Person {contact_id: $cid})-[r]-(root:Root) RETURN r.msg_ids AS msg_ids", cid=c_id
                ):
                    ids.extend(rec.get('msg_ids') or [])
            elif c_type == 2:
                if not in_data:
                    for rec in session.run(
                        "MATCH (c:Category {category_id: $cid})-[r]-(p:Person) RETURN r.msg_ids AS msg_ids", cid=c_id
                    ):
                        ids.extend(rec.get('msg_ids') or [])
                else:
                    for pid in in_data:
                        for rec in session.run(
                            "MATCH (p:Person {contact_id: $pid})-[r]-(c:Category {category_id: $cid}) RETURN r.msg_ids AS msg_ids",
                            pid=pid, cid=c_id
                        ):
                            ids.extend(rec.get('msg_ids') or [])
            elif c_type == 3 and isinstance(in_data, list) and len(in_data) == 2:
                person_ids, category_ids = in_data
                if person_ids and category_ids:
                    for pid in person_ids:
                        for cat in category_ids:
                            recs = session.run(
                                "MATCH (p:Person {contact_id: $pid})-[r1]-(c:Category {category_id: $cat})-[r2]-(s:Subcategory {subcategory_id: $cid}) "
                                "RETURN r2.msg_ids AS msg_ids, r2.cids AS cids",
                                pid=pid, cat=cat, cid=c_id
                            )
                            for rec in recs:
                                mids = rec.get('msg_ids') or []
                                cids = rec.get('cids') or []
                                for i, contact in enumerate(cids):
                                    if contact in person_ids:
                                        ids.append(mids[i])
                elif person_ids:
                    for pid in person_ids:
                        for rec in session.run(
                            "MATCH (p:Person {contact_id: $pid})-[r]-(c:Category) RETURN r.msg_ids AS msg_ids, r.cids AS cids", pid=pid
                        ):
                            mids = rec.get('msg_ids') or []
                            cids = rec.get('cids') or []
                            for i, contact in enumerate(cids):
                                if contact == pid:
                                    ids.append(mids[i])
                elif category_ids:
                    for cat in category_ids:
                        for rec in session.run(
                            "MATCH (c:Category {category_id: $cat})-[r]-(s:Subcategory {subcategory_id: $cid}) "
                            "RETURN r.msg_ids AS msg_ids",
                            cat=cat, cid=c_id
                        ):
                            ids.extend(rec.get('msg_ids') or [])
                else:
                    for rec in session.run(
                        "MATCH (s:Subcategory {subcategory_id: $cid})-[r]-(c:Category) RETURN r.msg_ids AS msg_ids", cid=c_id
                    ):
                        ids.extend(rec.get('msg_ids') or [])

        ids = list(dict.fromkeys(ids))  # 중복 제거

        # SQLite 메일 조회
        emails = []
        if ids:
            cur = conn.cursor()
            placeholders = ','.join('?' for _ in ids)
            sql = f"""
                SELECT message_id, thread_id, from_email, from_name, subject, snippet, sent_at, is_read
                FROM Message WHERE message_id IN ({placeholders})
                ORDER BY sent_at DESC
            """
            cur.execute(sql, ids)
            for row in cur.fetchall():
                emails.append({
                    "message_id": row[0],
                    "threadId":   row[1],
                    "fromEmail":  row[2],
                    "fromName":   row[3],
                    "subject":    row[4],
                    "snippet":    row[5],
                    "sentAt":     row[6],
                    "isRead":     bool(row[7]),
                })

        result = {'status': 'success', 'message': 'emails fetched', 'result': {'emails': emails}}
        #print(json.dumps(result, ensure_ascii=False, indent=2))
        return result

    except Exception as e:
        error = {'status': 'fail', 'message': str(e), 'result': {}}
        #print(json.dumps(error, ensure_ascii=False, indent=2))
        return error

    finally:
        driver.close()
        conn.close()

# 노드 생성
# 입력: {"C_name": "새로운 카테고리"}
# 출력: {"status": "success", "message": "성공"} 또는 {"status": "fail", "message": "오류 내용"}
def create_node_py(json_obj):
    name = json_obj.get("C_name")
    if not name:
        return {"status": "fail", "message": "내용이 비어있습니다."}

    name = name.strip()

    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cur = conn.cursor()

        print(f"[create_node_py] Checking if '{name}' already exists in Category...")
        cur.execute("SELECT category_name FROM Category")
        existing_names = [row[0].strip().lower() for row in cur.fetchall()]
        if name.lower() in existing_names:
            return {"status": "fail", "message": f"'{name}'는 이미 존재합니다."}

        cur.execute("SELECT MAX(category_id) FROM Category")
        max_id = cur.fetchone()[0] or 0

        print(f"[create_node_py] Inserting new category: ID={max_id+1}, name={name}")
        cur.execute("INSERT INTO Category (category_id, category_name) VALUES (?, ?)", (max_id + 1, name))
        conn.commit()
        conn.close()

        initialize_graph_from_sqlite_py()
        return {"status": "success", "message": "성공"}
    except Exception as e:
        return {"status": "fail", "message": str(e)}

# 노드 삭제
# 입력: {"C_ID": 노드 ID, "C_type": 노드 타입}
# 출력: {"status": "success"} 또는 {"status": "fail"}
def delete_node_py(json_obj):
    c_id = json_obj.get("C_ID")
    c_type = json_obj.get("C_type")
    if c_id is None or c_type not in [1, 2, 3]:
        return {"status": "fail"}

    label = {1: "Person", 2: "Category", 3: "Subcategory"}.get(c_type)
    prop = {1: "contact_id", 2: "category_id", 3: "subcategory_id"}.get(c_type)

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    try:
        with driver.session() as session:
            result = session.run(f"MATCH (n:{label} {{{prop}: $val}}) RETURN count(n) AS count", val=c_id)
            count = result.single()["count"]
        driver.close()
        return {"status": "fail" if count else "success"}
    except:
        return {"status": "fail"}

# 노드 이름 변경
# 입력: {"before_name": "노드 이전 이름", "after_name": "노드 새 이름"}
# 출력: {"status": "success"} 또는 {"status": "fail"}
def rename_node_py(json_obj):
    before = json_obj.get("before_name")
    after = json_obj.get("after_name")
    if not before or not after:
        return {"status": "fail"}

    try:
        if os.path.exists(FINAL_MAP_PATH):
            final_map = json.load(open(FINAL_MAP_PATH, encoding="utf-8"))
        else:
            final_map = {}

        # 전체 연쇄 추적 반영
        for k in list(final_map):
            if resolve_final_name(final_map[k], final_map) == before:
                final_map[k] = after
        final_map[before] = after

        json.dump(final_map, open(FINAL_MAP_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        initialize_graph_from_sqlite_py()
        return {"status": "success"}
    except Exception as e:
        print("[rename_node_py error]", e)
        return {"status": "fail"}

# 노드 병합
# 입력: {"before_name1": "노드 이전 이름1", "before_name2": "노드 이전 이름2", "after_name": "노드 새 이름"}
# 출력: {"status": "success"} 또는 {"status": "fail"}
def merge_node_py(json_obj):
    b1 = json_obj.get("before_name1")
    b2 = json_obj.get("before_name2")
    after = json_obj.get("after_name")
    if not b1 or not b2 or not after:
        return {"status": "fail"}

    try:
        if os.path.exists(FINAL_MAP_PATH):
            final_map = json.load(open(FINAL_MAP_PATH, encoding="utf-8"))
        else:
            final_map = {}

        # 전체 연쇄 추적 반영
        for k in list(final_map):
            if resolve_final_name(final_map[k], final_map) in [b1, b2]:
                final_map[k] = after
        final_map[b1] = after
        final_map[b2] = after

        json.dump(final_map, open(FINAL_MAP_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        initialize_graph_from_sqlite_py()
        return {"status": "success"}
    except Exception as e:
        print("[merge_node_py error]", e)
        return {"status": "fail"}

# 메일 삭제
# 입력: {"message_id": 메세지 ID}
# 출력: {"status": "success"} 또는 {"status": "fail"}
def delete_mail_py(json_obj):
    message_id = json_obj.get("message_id")
    if message_id is None:
        return {"status": "fail"}

    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cur = conn.cursor()
        cur.execute("DELETE FROM Message WHERE message_id = ?", (message_id,))
        conn.commit()
        conn.close()
        initialize_graph_from_sqlite_py()
        return {"status": "success"}
    except:
        return {"status": "fail"}

# 메일 이동
# 입력: {"message_id": 메세지 ID, "category_id": 카테고리 ID, "sub_category_id": 서브카테고리 ID}
# 출력: {"status": "success"} 또는 {"status": "fail"}
def move_mail_py(json_obj):
    message_id = json_obj.get("message_id")
    category_id = json_obj.get("category_id")
    sub_category_id = json_obj.get("sub_category_id")
    if None in [message_id, category_id, sub_category_id]:
        return {"status": "fail"}

    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cur = conn.cursor()
        cur.execute(
            "UPDATE Message SET category_id = ?, sub_category_id = ? WHERE message_id = ?",
            (category_id, sub_category_id, message_id)
        )
        conn.commit()
        conn.close()
        initialize_graph_from_sqlite_py()
        return {"status": "success"}
    except:
        return {"status": "fail"}


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

        if operation == "createNode":
            create_node_py(args)
        elif operation == "renameNode":
            result = rename_node_py(args)
        elif operation == "deleteNode":
            result = delete_node_py(args)
        elif operation == "readNode":
            result = read_node_py(args)
        elif operation == "readMessage":
            result = read_message_py(args)
        elif operation == "deleteMessage":
             result = delete_mail_py(args)
        elif operation == "updateLabel":
            result = rename_node_py(args)
        elif operation == "mergeNode":
            result = merge_node_py(args)
        elif operation == "moveEmail":
            result = move_mail_py(args)
        # elif operation == "searchByKeyword":
        #     result = search_by_keyword_py(args.get("keyword"))
        else:
            result = {"status": "error", "message": f"Python: Unknown operation '{operation}'"}

        print(json.dumps(result))
        sys.stdout.flush()

    except json.JSONDecodeError as e:
        err_msg = {"status": "error", "message": f"Python: Invalid JSON input - {str(e)}. Received: {raw_input_data[:500]}"}
        print(json.dumps(err_msg), file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)
    except Exception as e:
        err_msg = {"status": "error", "message": f"Python: An error occurred in operation '{input_data.get('operation', 'unknown')}' - {str(e)}"}
        print(json.dumps(err_msg), file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)