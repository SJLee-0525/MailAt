// // ---------------------------------------------------------------------------
// // Test Snippets for graph_operations.py functions (running against MOCKED Python backend)
// // Run these in your Electron app's Developer Console.
// // ---------------------------------------------------------------------------

// // 1. Test Neo4j Connection
async function testNeo4jConnection() {
  try {
    const result = await window.electronAPI.graph.testConnection();
    console.log("Test Neo4j Connection Result:", result);
  } catch (error) {
    console.error("Test Neo4j Connection Error:", error);
  }
}
testNeo4jConnection();

// // 2. Initialize Graph from SQLite (tests mock response)
async function testInitializeGraphFromSQLite() {
  try {
    const result = await window.electronAPI.graph.initializeGraphFromSQLite();
    console.log("Initialize Graph Result:", result);
  } catch (error) {
    console.error("Initialize Graph Error:", error);
  }
}
testInitializeGraphFromSQLite();

// // 6. Delete Node (tests mock response)
async function testDeleteNode() {
  try {
    const nodeId = 4; // Example node ID
    const result = await window.electronAPI.graph.deleteNode(nodeId);
    console.log("Delete Node Result:", result);
  } catch (error) {
    console.error("Delete Node Error:", error);
  }
}
testDeleteNode();

// // 11. Update Label (tests mock response)
async function testUpdateLabel() {
  try {
    const C_ID = "16"; // Example C_ID
    const newLabel = "엄성수_mocked"; // Example new label
    const result = await window.electronAPI.graph.updateLabel(C_ID, newLabel);
    console.log("Update Label Result:", result);
  } catch (error) {
    console.error("Update Label Error:", error);
  }
}
testUpdateLabel();

// // 13. Merge Node (tests mock response)
async function testMergeNode() {
  try {
    const from_C_ID = "node_id_source_mock"; // Example source node ID
    const to_C_ID = "node_id_target_mock"; // Example target node ID
    const result = await window.electronAPI.graph.mergeNode(from_C_ID, to_C_ID);
    console.log("Merge Node Result:", result);
  } catch (error) {
    console.error("Merge Node Error:", error);
  }
}
testMergeNode();

// // 15. Get Incoming Nodes
async function testGetIncomingNodes() {
  try {
    const node_name = "target_node_name_mock"; // Example node name
    const result = await window.electronAPI.graph.getIncomingNodes(node_name);
    console.log("Get Incoming Nodes Result:", result);
  } catch (error) {
    console.error("Get Incoming Nodes Error:", error);
  }
}
testGetIncomingNodes();

// // 17. Delete All Nodes
async function testDeleteAllNodes() {
  try {
    // WARNING: This will call the deleteAllNodes function.
    // With a mocked backend, it returns a success message without actual deletion.
    const result = await window.electronAPI.graph.deleteAllNodes();
    console.log("Delete All Nodes Result:", result);
  } catch (error) {
    console.error("Delete All Nodes Error:", error);
  }
}
if (confirm("Are you sure you want to call deleteAllNodes? (Mocked backend will simulate success)")) {
  testDeleteAllNodes();
}

// // 18. Move Complex Node (tests mock response)
async function testMoveComplexNode() {
  try {
    const a_id = "id_a_mock"; // Example ID
    const b_id = "id_b_mock"; // Example ID
    const c_id = "id_c_mock"; // Example ID
    const result = await window.electronAPI.graph.moveComplexNode(a_id, b_id, c_id);
    console.log("Move Complex Node Result:", result);
  } catch (error) {
    console.error("Move Complex Node Error:", error);
  }
}
testMoveComplexNode();

// // 21. Process and Embed Messages (tests mock response)
async function testProcessAndEmbedMessages() {
  try {
    const result = await window.electronAPI.graph.processAndEmbedMessages();
    console.log("Process and Embed Messages Result:", result);
  } catch (error) {
    console.error("Process and Embed Messages Error:", error);
  }
}
testProcessAndEmbedMessages();

// // 22. Build Graph (tests mock response)
async function testBuildGraph() {
  try {
    // WARNING: This calls buildGraph.
    // With a mocked backend, it returns a success message without actual graph building/clearing.
    const result = await window.electronAPI.graph.buildGraph();
    console.log("Build Graph Result:", result);
  } catch (error) {
    console.error("Build Graph Error:", error);
  }
}
if (confirm("Are you sure you want to call buildGraph? (Mocked backend will simulate success)")) {
 testBuildGraph();
}

// // 23. search_node
async function testFetchNodes() {
  try {
    // C_type for V2: 0:Root, 1:Person, 2:Category, 3:Subcategory (based on LABEL_MAP_SN)
    // IO_type: 1:incoming, 2:outgoing, 3:both
    const C_ID = 0; // Example: outgoing from Root node (contact_id 0)
    const C_type = 0;
    const IO_type = 2;
    const result = await window.electronAPI.graph.fetchNodes(C_ID, C_type, IO_type);
    console.log("Fetch Nodes Result:", result);
  } catch (error) {
    console.error("Fetch Nodes Error:", error);
  }
}
testFetchNodes();

// // 24. from search_mail
async function testFetchEmails() {
  try {
    const basic_C_ID = 1; // Example Person contact_id
    const C_type = 1;       // C_type 1 for Person
    const IO_type = 3;      // Example: both directions
    const in_data = null;    // Optional: { person_ids: [...], category_ids: [...] } depending on C_type
    const result = await window.electronAPI.graph.fetchEmails(basic_C_ID, C_type, IO_type, in_data);
    console.log("Fetch Emails Result:", result);
  } catch (error) {
    console.error("Fetch Emails Error:", error);
  }
}
testFetchEmails();
