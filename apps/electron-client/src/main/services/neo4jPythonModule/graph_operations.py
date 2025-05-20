import sys
import json
import neo4j
import sqlite3
import os

# --- Configuration ---
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASS = "message-gustav-rufus-alex-roman-2104" # From other scripts

# Determine the absolute path to the script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))
# Construct the absolute path to editemaildb.sqlite
SQLITE_DB_PATH = os.path.abspath(os.path.join(script_dir, "..", "..", "..", "..", "emaildb.sqlite"))
print(f"[Python] SQLITE_DB_PATH: {SQLITE_DB_PATH}")


# From search_node.py (for read_node_py)
LABEL_MAP_SN = {0: 'Root', 1: 'Person', 2: 'Category', 3: 'Subcategory'}
CTYPE_MAP_SN = {v: k for k, v in LABEL_MAP_SN.items()}

driver = None

def get_driver():
    print("[Python] get_driver() 실행")
    global driver
    if driver is None:
        try:
            driver = neo4j.GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
            driver.verify_connectivity() # 연결 확인
            print("[Python] Neo4j driver initialized and connected.")
        except neo4j.exceptions.AuthError as e:
            print(f"[Python] Neo4j authentication failed: {e}")
            raise
        except neo4j.exceptions.ServiceUnavailable as e:
            print(f"[Python] Neo4j service unavailable: {e}")
            raise
        except Exception as e:
            print(f"[Python] Error initializing Neo4j driver: {e}")
            raise
    return driver

def close_driver():
    print("[Python] close_driver() 실행")
    global driver
    if driver is not None:
        driver.close()
        driver = None
        print("[Python] Neo4j driver closed.")

def _execute_query(query, params=None):
    print("[Python] _execute_query() 실행")
    loc_driver = get_driver()
    with loc_driver.session(database="neo4j") as session: # 명시적으로 데이터베이스 지정
        try:
            result = session.run(query, params)
            return result
        except Exception as e:
            print(f"[Python] Error executing query: {query} with params {params}. Error: {e}")
            raise

# --- Function from make_node.py ---
def initialize_graph_from_sqlite_py():
    print("[Python] initialize_graph_from_sqlite_py() 실행")
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"[Python] SQLite database file not found at {SQLITE_DB_PATH}")
        return {"status": "error", "message": f"Python: SQLite database file not found at {SQLITE_DB_PATH}"}

    try:
        # 1) SQLite에서 데이터 로드
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cur = conn.cursor()
        print("[Python] Connected to SQLite.")

        cur.execute("SELECT email FROM Account;")
        account_emails = [row[0].lower() for row in cur.fetchall()]
        print(f"[Python] Loaded {len(account_emails)} account emails from SQLite.")

        cur.execute("SELECT message_id, category_id, sub_category_id, from_email, subject, sent_at FROM Message;") # Message 테이블에서 필요한 컬럼 추가
        messages_data = cur.fetchall()
        print(f"[Python] Loaded {len(messages_data)} messages from SQLite.")

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

        print(f"[Python] Loaded {len(msg_contacts)} message contact relations from SQLite.")

        cur.execute("SELECT contact_id, name, email FROM EmailContact;")
        email_contacts_map = {cid: (name, email.lower() if email else None) for cid, name, email in cur.fetchall()}
        print(f"[Python] Loaded {len(email_contacts_map)} email contacts from SQLite.")

        cur.execute("SELECT category_id, category_name FROM Category;")
        category_map = {cid: name for cid, name in cur.fetchall()}
        print(f"[Python] Loaded {len(category_map)} categories from SQLite.")
        conn.close()
        print("[Python] SQLite connection closed.")

        # 2) Neo4j 연결 및 그래프 생성
        loc_driver = get_driver()
        with loc_driver.session(database="neo4j") as sess: # 명시적으로 데이터베이스 지정
            print("[Python] Neo4j session started.")
            # 기존 그래프 데이터 삭제 (초기화 시 필요할 수 있음, 주의해서 사용)
            # print("[Python] Clearing existing graph data...")
            # sess.run("MATCH (n) DETACH DELETE n")
            # print("[Python] Existing graph data cleared.")

            # Account 노드 생성
            for acc_email in account_emails:
                sess.run("MERGE (a:Account {email: $email})", email=acc_email)
            print(f"[Python] Created/Merged {len(account_emails)} Account nodes.")

            # Person 노드 생성 (EmailContact 기반)
            for contact_id, (name, email) in email_contacts_map.items():
                if email: # 이메일이 있는 경우에만 Person 노드 생성 시도
                    sess.run("MERGE (p:Person {email: $email}) ON CREATE SET p.contact_id = $contact_id, p.name = $name ON MATCH SET p.contact_id = coalesce(p.contact_id, $contact_id), p.name = coalesce(p.name, $name)",
                             contact_id=contact_id, name=name, email=email)
                elif name: # 이메일은 없지만 이름은 있는 경우 (예: 로컬 주소록의 이름만 있는 연락처)
                     sess.run("MERGE (p:Person {name: $name, contact_id: $contact_id})", # 이메일 없이 이름과 ID로 MERGE
                             contact_id=contact_id, name=name)

            print(f"[Python] Created/Merged {len(email_contacts_map)} Person nodes (based on email_contacts_map).")

            # Category 노드 생성
            for cat_id, cat_name in category_map.items():
                sess.run("MERGE (c:Category {category_id: $cat_id}) SET c.name = $cat_name",
                         cat_id=cat_id, cat_name=cat_name)
            print(f"[Python] Created/Merged {len(category_map)} Category nodes.")

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
            print(f"[Python] Created/Merged Message nodes and their relationships.")

            # Account와 Person (사용자 자신) 연결
            # Account의 이메일과 일치하는 Person 노드가 있다면 :IS_USER 관계 추가
            for acc_email_val in account_emails:
                 sess.run("""
                    MATCH (acc:Account {email: $acc_email})
                    MATCH (p:Person {email: $acc_email}) // 계정 이메일과 동일한 이메일을 가진 Person
                    MERGE (acc)-[:IS_PERSON]->(p)
                    MERGE (p)-[:IS_ACCOUNT_HOLDER_OF]->(acc) // 양방향 또는 단방향 선택
                 """, acc_email=acc_email_val)
            print(f"[Python] Linked Account nodes to their corresponding Person nodes.")

            print("[Python] Neo4j session finished.")
        return {"status": "success", "message": "Python: Graph initialized successfully from SQLite."}
    except sqlite3.Error as e:
        print(f"[Python] SQLite error: {e}")
        return {"status": "error", "message": f"Python: SQLite error - {str(e)}"}
    except neo4j.exceptions.Neo4jError as e:
        print(f"[Python] Neo4jError: {e}")
        return {"status": "error", "message": f"Python: Neo4jError - {str(e)}"}
    except Exception as e:
        import traceback
        print(f"[Python] Error initializing graph: {str(e)}")
        print(traceback.format_exc())
        return {"status": "error", "message": f"Python: Error initializing graph - {str(e)}"}

# --- Function from search_node.py (for read_node_py) ---
def read_node_py(c_id, c_type, io_type):
    print("[Python] read_node_py() 실행")
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
    print("[Python] read_message_py() 실행")
    try:
        io_type = filter_data.get("io_type")
        in_data = filter_data.get("in_data") # Expected to be [[person_ids], [category_ids]] for c_type=3

        loc_driver = get_driver()
        msg_ids = []
        with loc_driver.session() as session:
            # This logic is complex and adapted from EmailGenerator.fetch_msg_ids
            if c_type == 0: # Root - all messages (potentially very large)
                # Simplified: Get some messages, or define specific logic for Root
                # For now, let's assume it means it means messages related to '나' (Root)
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
                # in_data might contain person_ids to filter by
                person_ids_filter = in_data.get('person_ids') if isinstance(in_data, dict) else (in_data[0] if isinstance(in_data, list) and len(in_data)>0 else None)
                if person_ids_filter:
                    for pid in person_ids_filter:
                        for rec in session.run(
                            "MATCH (p:Person {contact_id: $pid})-[r]-(c:Category {category_id: $cid}) RETURN r.msg_ids AS msg_ids",
                            pid=pid, cid=basic_c_id
                        ):
                            msg_ids.extend(rec.get('msg_ids') or [])
                else: # No person filter, get all messages for this category
                    for rec in session.run(
                        "MATCH (c:Category {category_id: $cid})-[r]-(p:Person) RETURN r.msg_ids AS msg_ids", cid=basic_c_id
                    ):
                        msg_ids.extend(rec.get('msg_ids') or [])
            elif c_type == 3: # Subcategory
                # in_data: [[person_ids], [category_ids]]
                person_ids_filter = in_data[0] if isinstance(in_data, list) and len(in_data) > 0 else None
                # category_ids_filter = in_data[1] if isinstance(in_data, list) and len(in_data) > 1 else None # Not directly used in search_mail.py logic for subcat msg_ids

                # Logic from search_mail.py for Subcategory was to find relations to Category, then check cids in relation
                # This is a simplified interpretation for now.
                # The original search_mail.py logic for c_type=3 was quite involved.
                # This part needs careful review against the exact desired behavior from search_mail.py
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

        # Fetch emails from SQLite
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

# --- Functions from modify_node.py ---
def delete_node_py(node_id): # Corresponds to delete_node_if_empty
    print("[Python] delete_node_py() 실행")
    try:
        # Assuming node_id is the 'id' property used in modify_node.py
        # This function expects a generic 'Node' label and 'id' property.
        # This might need adjustment if your nodes have specific labels and ID properties (e.g., contact_id for Person)
        # For now, we'll assume a generic 'id' property. If C_ID is passed, it might be an internal DB ID.
        # The original deleteNode in graphController passes just 'nodeId'.
        # Let's assume nodeId is a unique identifier property on the node.
        query = """
        MATCH (n) WHERE n.id = $node_id OR id(n) = $node_id_int
        OPTIONAL MATCH (n)-[r]-()
        WITH n, count(r) as rel_count
        WHERE rel_count = 0 // Or specific logic from delete_node_if_empty
        DETACH DELETE n
        RETURN count(n) as deleted_count
        """
        # Try to convert nodeId to int if it's a numeric string, for matching id(n)
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
            # This part needs the exact logic of "delete_node_if_empty" if it's more complex
            # The query from modify_node.py was:
            # MATCH (n:Node {id: $a_id}) OPTIONAL MATCH (n)-[r]-()
            # WITH n, collect(r) AS rels, collect(CASE WHEN startNode(r).id = $a_id THEN endNode(r).id ELSE startNode(r).id END) AS linked_ids, keys(n) AS node_keys
            # WITH n, node_keys, linked_ids, reduce(s = [], x IN linked_ids | CASE WHEN x IN s THEN s ELSE s + [x] END) AS unique_ids
            # WHERE size(unique_ids) = 1 AND all(key IN node_keys WHERE key = 'id') DETACH DELETE n
            # This is too specific if node_id is not always on a :Node with only 'id' property.
            # For now, a simpler "delete if no relationships" is implemented above.
            return {"status": "success", "message": f"Python: Node '{node_id}' not deleted (either not found or has relationships/failed conditions).", "result": {"deletedNodeId": None}}
    except Exception as e:
        return {"status": "error", "message": f"Python: Error deleting node '{node_id}': {str(e)}"}

def merge_node_py(from_c_id, to_c_id): # Corresponds to merge_nodes_to_new
    print("[Python] merge_node_py() 실행")
    try:
        # Assuming from_c_id and to_c_id are values of a common 'id' property (e.g., 'name' or 'unique_id')
        # The original script used generic :Node {id: ...}
        # This needs to be adapted if your IDs are specific (e.g. contact_id on :Person)
        # For simplicity, let's assume 'name' property for merging.
        # The new node will be named from_c_id + "_" + to_c_id

        new_node_id = f"{from_c_id}_{to_c_id}"
        query = """
        MATCH (a {name: $from_id}), (b {name: $to_id})
        WHERE id(a) <> id(b)
        CALL apoc.refactor.mergeNodes([a,b], {properties: 'combine', mergeRels: true}) YIELD node
        SET node.name = $new_id
        RETURN node.name as merged_node_name
        """
        # This uses APOC. If APOC is not available, the manual merge from modify_node.py is needed.
        # Manual merge logic from modify_node.py (if APOC not available or desired):
        # MERGE (c:Node {id: $new_node_id_val})
        # WITH a, b, c
        # CALL { WITH a, c, b MATCH (a)-[r]->(x) WHERE x <> b MERGE (c)-[new_r:REL]->(x) SET new_r = r }
        # CALL { WITH a, c, b MATCH (x)-[r]->(a) WHERE x <> b MERGE (x)-[new_r:REL]->(c) SET new_r = r }
        # CALL { WITH b, c, a MATCH (b)-[r]->(x) WHERE x <> a MERGE (c)-[new_r:REL]->(x) SET new_r = r }
        # CALL { WITH b, c, a MATCH (x)-[r]->(b) WHERE x <> a MERGE (x)-[new_r:REL]->(c) SET new_r = r }
        # DETACH DELETE a,b
        # RETURN c.id as merged_node_name
        # For now, assuming APOC for brevity. Replace with manual if needed.
        
        result = _execute_query(query, params={"from_id": from_c_id, "to_id": to_c_id, "new_id": new_node_id}).single()
        if result and result["merged_node_name"]:
            return {"status": "success", "message": f"Python: Nodes '{from_c_id}' and '{to_c_id}' merged into '{result['merged_node_name']}'.", "result": {"mergedNodeId": result["merged_node_name"]}}
        else:
            # Check if nodes exist
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


def update_label_py(c_id, new_label_name): # c_id is the identifier, new_label_name is the new name/label value
    print("[Python] update_label_py() 실행")
    try:
        # Assuming c_id is a unique property value (e.g., contact_id, category_id, or a generic 'id')
        # And we are updating a 'name' property.
        # This needs to know which property identifies the node and which property to update.
        # Let's assume we match by a property 'id_prop' (could be contact_id, etc.) and set 'name'.
        # This is a guess. The JS side sends C_ID and newLabel.
        # Let's try to update the 'name' property of a node identified by ANY of its unique IDs.
        
        # Attempt to find node by common ID properties and update its 'name'
        # This is a generic attempt; specific node types might need different ID properties.
        query = """
        MATCH (n)
        WHERE n.contact_id = $id_val OR n.category_id = $id_val OR n.subcategory_id = $id_val OR n.name = $id_val_str OR n.id = $id_val_str
        SET n.name = $new_name
        RETURN count(n) as updated_count
        """
        id_val_int = None
        try:
            id_val_int = int(c_id)
        except ValueError: # c_id is not purely integer
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
    print("[Python] get_incoming_nodes_py() 실행")
    try:
        # From modify_node.py's show_incoming_nodes, assuming node_name_param is the 'name' property
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
                c_id = record.get("contact_id") # Assuming Root might have contact_id = 0
            node_details["C_ID"] = c_id
            node_details["C_type"] = c_type
            nodes.append(node_details)

        return {"status": "success", "message": f"Python: Incoming nodes for '{node_name_param}' fetched.", "result": {"nodes": nodes}}
    except Exception as e:
        return {"status": "error", "message": f"Python: Error fetching incoming nodes: {str(e)}"}

def delete_all_nodes_py():
    print("[Python] delete_all_nodes_py() 실행")
    try:
        _execute_query("MATCH (n) DETACH DELETE n")
        return {"status": "success", "message": "Python: All nodes and relationships deleted."}
    except Exception as e:
        return {"status": "error", "message": f"Python: Error deleting all nodes: {str(e)}"}

def move_complex_node_py(a_id, b_id, c_id): # From modify_node.py's move_node
    print("[Python] move_complex_node_py() 실행")
    try:
        # This assumes :Node label and 'id' property as in modify_node.py
        # This is a complex operation and might need adjustment for specific graph models
        query = """
        MATCH (a:Node {id: $a_id_val})
        MATCH (b:Node {id: $b_id_val})
        MERGE (c:Node {id: $c_id_val})
        
        // Replicate relationships from a to c, excluding b
        CALL {
            WITH a, c, b
            MATCH (a)-[r]->(x) WHERE x <> b
            MERGE (c)-[new_r:REL]->(x) SET new_r = properties(r)
        }
        CALL {
            WITH a, c, b
            MATCH (x)-[r]->(a) WHERE x <> b
            MERGE (x)-[new_r:REL]->(c) SET new_r = properties(r)
        }
        // Detach and delete a
        DETACH DELETE a
        // Original script also deleted relationships between a and b, which is covered by DETACH DELETE a
        // And created new relationships between a and c, which is now c and others.
        // The original query was:
        // OPTIONAL MATCH (a)-[r1:REL]->(b) OPTIONAL MATCH (b)-[r2:REL]->(a) DELETE r1, r2
        // MERGE (a)-[:REL {name: $a_id}]->(c) MERGE (c)-[:REL {name: $a_id}]->(a)
        // This logic seems to be about making 'c' a proxy for 'a' in some contexts.
        // The provided query in modify_node.py is specific. For now, a simpler "move relationships and delete"
        // is implemented above by refactoring 'a's relationships to 'c' then deleting 'a'.
        """
        # The query from modify_node.py is very specific and creates new relationships.
        # For now, this is a placeholder for that complex logic.
        # A full implementation would require careful porting of its Cypher.
        # _execute_query(query, params={"a_id_val": a_id, "b_id_val": b_id, "c_id_val": c_id})
        return {"status": "success", "message": f"Python: move_complex_node_py (placeholder) called for {a_id}, {b_id}, {c_id}. Full logic TBD."}
    except Exception as e:
        return {"status": "error", "message": f"Python: Error in move_complex_node: {str(e)}"}


# --- Placeholder functions from original graph_operations.py or un-implemented from modify_node.py ---
def test_connection():
    print("[Python] test_connection() 실행")
    try:
        # 여기에 실제 Neo4j 드라이버 연결 테스트 로직을 추가할 수 있습니다.
        # 예시로 간단히 성공 응답을 반환합니다.
        get_driver() # 드라이버 초기화 시도
        close_driver() # 테스트 후 드라이버 닫기 (선택 사항)
        return {"status": "success", "message": "Python: Neo4j connection test successful."}
    except Exception as e:
        return {"status": "error", "message": f"Python: Neo4j connection test failed: {str(e)}"}

def read_graph_data_py():
    print("[Python] read_graph_data_py() 실행")
    return {"status": "success", "message": "Python: read_graph_data_py (placeholder) called", "result": {"nodes": [], "edges": []}}

def create_node_py(node_data):
    print("[Python] create_node_py() 실행")
    return {"status": "success", "message": "Python: create_node_py (placeholder) called", "result": {"nodeId": 123, "data": node_data}}

def update_node_py(node_id, update_data):
    print("[Python] update_node_py() 실행")
    return {"status": "success", "message": f"Python: update_node_py (placeholder) called for node {node_id}", "result": {"updatedData": update_data}}

def create_relationship_py(from_node_id, to_node_id, relationship_type, properties):
    print("[Python] create_relationship_py() 실행")
    return {"status": "success", "message": f"Python: create_relationship_py (placeholder) called between {from_node_id} and {to_node_id}", "result": {"relationshipId": 789}}

def delete_relationship_py(relationship_id):
    print("[Python] delete_relationship_py() 실행")
    return {"status": "success", "message": f"Python: delete_relationship_py (placeholder) called for relationship {relationship_id}", "result": {"deletedRelationshipId": relationship_id}}

def search_by_keyword_py(keyword):
    print("[Python] search_by_keyword_py() 실행")
    return {"status": "success", "message": f"Python: search_by_keyword_py (placeholder) called with keyword '{keyword}'", "result": {"nodes": []}}

def llm_tag_node_py(c_id, llm_tags):
    print("[Python] llm_tag_node_py() 실행")
    return {"status": "success", "message": f"Python: llm_tag_node_py (placeholder) called for C_ID {c_id} with tags {llm_tags}", "result": {}}

def get_outgoing_nodes_py(node_name):
    print("[Python] get_outgoing_nodes_py() 실행")
    return {"status": "success", "message": f"Python: get_outgoing_nodes_py (placeholder) called for node {node_name}", "result": {"nodes": []}}

def move_email_py(from_id, to_id, email_uid):
    print("[Python] move_email_py() 실행")
    return {"status": "success", "message": f"Python: move_email_py (placeholder) called for email {email_uid} from {from_id} to {to_id}", "result": {}}

def get_node_emails_py(node_name):
    print("[Python] get_node_emails_py() 실행")
    return {"status": "success", "message": f"Python: get_node_emails_py (placeholder) called for node {node_name}", "result": {"emails": []}}


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
        elif operation == "readGraphData":
            result = read_graph_data_py()
        elif operation == "createNode":
            result = create_node_py(args.get("nodeData"))
        elif operation == "updateNode":
            result = update_node_py(args.get("nodeId"), args.get("updateData"))
        elif operation == "deleteNode":
            result = delete_node_py(args.get("nodeId"))
        elif operation == "createRelationship":
            result = create_relationship_py(args.get("fromNodeId"), args.get("toNodeId"), args.get("relationshipType"), args.get("properties"))
        elif operation == "deleteRelationship":
            result = delete_relationship_py(args.get("relationshipId"))
        elif operation == "readNode":
            result = read_node_py(args.get("C_ID"), args.get("C_type"), args.get("IO_type"))
        elif operation == "readMessage":
            # Assuming filter_data is passed directly if it's a complex object
            # or reconstruct it if passed as individual args
            filter_arg = args.get("filter") if args.get("filter") is not None else {"io_type": args.get("IO_type"), "in_data": args.get("in_data")}
            result = read_message_py(args.get("basic_C_ID"), args.get("C_type"), filter_arg)
        elif operation == "deleteMessage": # This was a placeholder, remains so unless logic is provided
             result = {"status": "success", "message": f"Python: delete_message_py called for message_C_ID {args.get('message_C_ID')}, except_C_ID {args.get('except_C_ID')}", "result": {}}
        elif operation == "updateLabel":
            result = update_label_py(args.get("C_ID"), args.get("newLabel"))
        elif operation == "searchByKeyword":
            result = search_by_keyword_py(args.get("keyword"))
        elif operation == "mergeNode":
            result = merge_node_py(args.get("from_C_ID"), args.get("to_C_ID"))
        elif operation == "llmTagNode":
            result = llm_tag_node_py(args.get("C_ID"), args.get("llm_tags"))
        # New operations
        elif operation == "getIncomingNodes":
            result = get_incoming_nodes_py(args.get("node_name"))
        elif operation == "getOutgoingNodes":
            result = get_outgoing_nodes_py(args.get("node_name"))
        elif operation == "deleteAllNodes":
            result = delete_all_nodes_py()
        elif operation == "moveComplexNode":
            result = move_complex_node_py(args.get("a_id"), args.get("b_id"), args.get("c_id"))
        elif operation == "moveEmail":
            result = move_email_py(args.get("from_id"), args.get("to_id"), args.get("email_uid"))
        elif operation == "getNodeEmails":
            result = get_node_emails_py(args.get("node_name"))
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
    finally:
        close_driver() # Ensure driver is closed if it was opened