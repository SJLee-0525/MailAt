// // ---------------------------------------------------------------------------
// // Test Snippets for graph_operations.py functions (running against Python backend via Electron IPC)
// // Run these in your Electron app's Developer Console.
// // ---------------------------------------------------------------------------

// // 2. Initialize Graph from SQLite
async function testInitializeGraphFromSQLitePy() {
  try {
    // Calls electronAPI.graph.initializeGraphFromSQLitePy()
    const result = await window.electronAPI.graph.initializeGraphFromSQLitePy();
    console.log("Initialize Graph (SQLite) Result:", result);
  } catch (error) {
    console.error("Initialize Graph (SQLite) Error:", error);
  }
}
testInitializeGraphFromSQLitePy(); // Call when needed

// // 3. Process and Embed Messages
async function testProcessAndEmbedMessagesPy() {
  try {
    // Calls electronAPI.graph.processAndEmbedMessagesPy()
    const result = await window.electronAPI.graph.processAndEmbedMessagesPy();
    console.log("Process and Embed Messages Result:", result);
  } catch (error) {
    console.error("Process and Embed Messages Error:", error);
  }
}
testProcessAndEmbedMessagesPy(); // Call when needed

// // 4. Read Node (replaces testFetchNodes)
async function testReadNodePy() {
  try {
    const params = {
      "C_ID": "some_node_id_mock", // Example: contact_id or category_id
      "C_type": 1, // Example: 0:Root, 1:Person, 2:Category, 3:Subcategory
      "IO_type": 3 // Example: 1:in, 2:out, 3:in&out
    };
    const result = await window.electronAPI.graph.readNodePy(params);
    console.log("Read Node Result:", result);
  } catch (error) {
    console.error("Read Node Error:", error);
  }
}
testReadNodePy();

// // 5. Read Message (replaces testFetchEmails)
async function testReadMessagePy() {
  try {
    const params = {
      "C_ID": "some_node_id_mock",
      "C_type": 2, // Example: Category
      "IO_type": 1, // Always 1 for messages as per Python doc
      "In": ["person_id_1_mock", "person_id_2_mock"] // Example: [Person ID] for Category
    };
    const result = await window.electronAPI.graph.readMessagePy(params);
    console.log("Read Message Result:", result);
  } catch (error) {
    console.error("Read Message Error:", error);
  }
}
testReadMessagePy();

// // 6. Create Node
async function testCreateNodePy() {
  try {
    const params = { "C_name": "New Test Category Mock" };
    const result = await window.electronAPI.graph.createNodePy(params);
    console.log("Create Node Result:", result);
  } catch (error) {
    console.error("Create Node Error:", error);
  }
}
testCreateNodePy();

// // 7. Delete Node
async function testDeleteNodePy() {
  try {
    const params = {
      "C_ID": "node_id_to_delete_mock", // ID of the node to delete
      "C_type": 2 // Type of the node to delete (e.g., 2 for Category)
    };
    const result = await window.electronAPI.graph.deleteNodePy(params);
    console.log("Delete Node Result:", result);
  } catch (error) {
    console.error("Delete Node Error:", error);
  }
}
testDeleteNodePy();

// // 8. Rename Node (replaces testUpdateLabel)
async function testRenameNodePy() {
  try {
    const params = {
      "before_name": "Old Node Name Mock",
      "after_name": "New Node Name Mocked"
    };
    const result = await window.electronAPI.graph.renameNodePy(params);
    console.log("Rename Node Result:", result);
  } catch (error) {
    console.error("Rename Node Error:", error);
  }
}
testRenameNodePy();

// // 9. Merge Node
async function testMergeNodePy() {
  try {
    const params = {
      "before_name1": "Node Name 1 Mock",
      "before_name2": "Node Name 2 Mock",
      "after_name": "Merged Node Name Mock"
    };
    const result = await window.electronAPI.graph.mergeNodePy(params);
    console.log("Merge Node Result:", result);
  } catch (error) {
    console.error("Merge Node Error:", error);
  }
}
testMergeNodePy();

// // 10. Delete Mail
async function testDeleteMailPy() {
  try {
    const params = { "message_id": "message_id_to_delete_mock" };
    const result = await window.electronAPI.graph.deleteMailPy(params);
    console.log("Delete Mail Result:", result);
  } catch (error) {
    console.error("Delete Mail Error:", error);
  }
}
testDeleteMailPy();

// // 11. Move Mail
async function testMoveMailPy() {
  try {
    const params = {
      "message_id": "message_id_to_move_mock",
      "category_id": "target_category_id_mock",
      "sub_category_id": "target_sub_category_id_mock"
    };
    const result = await window.electronAPI.graph.moveMailPy(params);
    console.log("Move Mail Result:", result);
  } catch (error) {
    console.error("Move Mail Error:", error);
  }
}
testMoveMailPy();