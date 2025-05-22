// imap_wrapper.hpp
#pragma once

#include <napi.h>
#include <mailio/imap.hpp>

class ImapWrapper : public Napi::ObjectWrap<ImapWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ImapWrapper(const Napi::CallbackInfo& info);

private:
    // Authentication
    Napi::Value Authenticate(const Napi::CallbackInfo& info);

    // Mailbox selection and statistics
    Napi::Value Select(const Napi::CallbackInfo& info);
    Napi::Value SelectByList(const Napi::CallbackInfo& info);
    Napi::Value Statistics(const Napi::CallbackInfo& info);
    Napi::Value StatisticsByList(const Napi::CallbackInfo& info);
    Napi::Value FolderDelimiter(const Napi::CallbackInfo& info);

    // Fetch and remove
    Napi::Value FetchOne(const Napi::CallbackInfo& info);
    Napi::Value FetchByUid(const Napi::CallbackInfo& info);
    Napi::Value RemoveOne(const Napi::CallbackInfo& info);
    Napi::Value RemoveByUid(const Napi::CallbackInfo& info);

    // Append
    Napi::Value AppendMessage(const Napi::CallbackInfo& info);
    Napi::Value AppendByList(const Napi::CallbackInfo& info);

    // Search
    Napi::Value SearchMessages(const Napi::CallbackInfo& info);
    Napi::Value SearchByUid(const Napi::CallbackInfo& info);
    Napi::Value SearchAll(const Napi::CallbackInfo& info);

    // Folder operations
    Napi::Value CreateFolder(const Napi::CallbackInfo& info);
    Napi::Value DeleteFolder(const Napi::CallbackInfo& info);
    Napi::Value RenameFolder(const Napi::CallbackInfo& info);
    Napi::Value ListFolders(const Napi::CallbackInfo& info);
    Napi::Value ListFoldersByList(const Napi::CallbackInfo& info);

    std::unique_ptr<mailio::imaps> imap_client_;
};