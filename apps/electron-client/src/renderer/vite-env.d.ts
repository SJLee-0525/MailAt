/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Add your environment variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Add a declaration for the electronAPI exposed in preload.cjs
// interface ElectronAPI {
//   sendEmail: (emailData: any) => Promise<any>;
//   testSmtpConnection: (config: any) => Promise<any>;
//   user: {
//     create: (userData: any) => Promise<any>;
//     get: (userId: any) => Promise<any>;
//     update: (userId: any, userData: any) => Promise<any>;
//     delete: (userId: any) => Promise<any>;
//   };
//   account: {
//     create: (accountData: any) => Promise<any>;
//     getAll: () => Promise<any>;
//     delete: (accountId: any) => Promise<any>;
//   };
//   imap: {
//     syncLatest: (accountId: any) => Promise<any>;
//     syncFolder: (params: { accountId: any; folderName: string; limit?: number }) => Promise<any>;
//     test: (config: any) => Promise<any>;
//   };
//   email: {
//     getFolders: (accountId: any) => Promise<any>;
//     getEmails: (params: any) => Promise<any>;
//     getThreads: (params: any) => Promise<any>;
//     getThreadsByEmail: (params: any) => Promise<any>;
//     getDetail: (messageId: any) => Promise<any>;
//     delete: (messageId: any) => Promise<any>;
//     markAsRead: (params: any) => Promise<any>;
//   };
//   graph: { // Added graph API definition
//     readData: () => Promise<any>;
//     createNode: (nodeData: any) => Promise<any>;
//     updateNode: (nodeId: any, updateData: any) => Promise<any>;
//     deleteNode: (nodeId: any) => Promise<any>;
//     readNode: (params: any) => Promise<any>;
//     readMessage: (params: any) => Promise<any>;
//     deleteMessage: (params: any) => Promise<any>;
//     updateLabel: (params: any) => Promise<any>;
//     searchByKeyword: (params: any) => Promise<any>;
//     mergeNode: (params: any) => Promise<any>;
//     llmTagNode: (params: any) => Promise<any>;
//     testGraph: (params?: any) => Promise<{ success: boolean; data?: any; message?: string }>; // Added testGraph
//     initializeGraphFromSQLite: () => Promise<any>;
//     getIncomingNodes: (params: any) => Promise<any>;
//     getOutgoingNodes: (params: any) => Promise<any>;
//     deleteAllNodes: () => Promise<any>;
//     moveComplexNode: (params: any) => Promise<any>;
//     moveEmail: (params: any) => Promise<any>;
//     getNodeEmails: (params: any) => Promise<any>;
//     createRelationship: (params: any) => Promise<any>;
//     deleteRelationship: (params: any) => Promise<any>;
//   };
//   dev: { // Added dev API definition
//     callBackendMethod: (serviceName: string, methodName: string, args: any) => Promise<any>;
//   };
//   debug: {
//     ping: () => string;
//     getInfo: () => any;
//   };
// }

// interface Window {
//   electronAPI: ElectronAPI;
// }
