// imap_wrapper.cpp (헤더 및 초기화 포함)
#include "imap_wrapper.hpp"
#include <mailio/message.hpp>
#include <sstream>

using namespace Napi;

Napi::Object ImapWrapper::Init(Napi::Env env, Napi::Object exports) {
    Function func = DefineClass(env, "ImapWrapper", {
        InstanceMethod("authenticate", &ImapWrapper::Authenticate),
        InstanceMethod("select", &ImapWrapper::Select),
        InstanceMethod("selectByList", &ImapWrapper::SelectByList),
        InstanceMethod("statistics", &ImapWrapper::Statistics),
        InstanceMethod("statisticsByList", &ImapWrapper::StatisticsByList),
        InstanceMethod("folderDelimiter", &ImapWrapper::FolderDelimiter),
        InstanceMethod("fetchOne", &ImapWrapper::FetchOne),
        InstanceMethod("fetchByUid", &ImapWrapper::FetchByUid),
        InstanceMethod("removeOne", &ImapWrapper::RemoveOne),
        InstanceMethod("removeByUid", &ImapWrapper::RemoveByUid),
        InstanceMethod("append", &ImapWrapper::AppendMessage),
        InstanceMethod("appendByList", &ImapWrapper::AppendByList),
        InstanceMethod("search", &ImapWrapper::SearchMessages),
        InstanceMethod("searchByUid", &ImapWrapper::SearchByUid),
        InstanceMethod("createFolder", &ImapWrapper::CreateFolder),
        InstanceMethod("deleteFolder", &ImapWrapper::DeleteFolder),
        InstanceMethod("renameFolder", &ImapWrapper::RenameFolder),
        InstanceMethod("listFolders", &ImapWrapper::ListFolders),
        InstanceMethod("listFoldersByList", &ImapWrapper::ListFoldersByList)
    });

    exports.Set("ImapWrapper", func);
    return exports;
}

ImapWrapper::ImapWrapper(const CallbackInfo& info) : ObjectWrap<ImapWrapper>(info) {
    std::string host = info[0].As<String>();
    int port = info[1].As<Number>().Int32Value();
    imap_client_ = std::make_unique<mailio::imaps>(host, port);
}

Value ImapWrapper::Authenticate(const CallbackInfo& info) {
    try {
        std::string user = info[0].As<String>();
        std::string pass = info[1].As<String>();
        std::string greeting = imap_client_->authenticate(user, pass, mailio::imaps::auth_method_t::LOGIN);
        return String::New(info.Env(), greeting);
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::Select(const CallbackInfo& info) {
    try {
        std::string mailbox = info[0].As<String>();
        mailio::imaps::mailbox_stat_t stat = imap_client_->select(mailbox);
        Object obj = Object::New(info.Env());
        obj.Set("messages_no", stat.messages_no);
        obj.Set("messages_recent", stat.messages_recent);
        obj.Set("messages_unseen", stat.messages_unseen);
        obj.Set("uid_next", stat.uid_next);
        obj.Set("uid_validity", stat.uid_validity);
        return obj;
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::SelectByList(const CallbackInfo& info) {
    try {
        Array folders = info[0].As<Array>();
        std::list<std::string> folder_list;
        for (uint32_t i = 0; i < folders.Length(); ++i)
            folder_list.push_back(folders.Get(i).As<String>().Utf8Value());
        mailio::imaps::mailbox_stat_t stat = imap_client_->select(folder_list);
        Object obj = Object::New(info.Env());
        obj.Set("messages_no", stat.messages_no);
        obj.Set("messages_recent", stat.messages_recent);
        obj.Set("messages_unseen", stat.messages_unseen);
        obj.Set("uid_next", stat.uid_next);
        obj.Set("uid_validity", stat.uid_validity);
        return obj;
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::Statistics(const CallbackInfo& info) {
    try {
        std::string mailbox = info[0].As<String>();
        unsigned int info_flags = info[1].As<Number>().Uint32Value();
        mailio::imaps::mailbox_stat_t stat = imap_client_->statistics(mailbox, info_flags);
        Object obj = Object::New(info.Env());
        obj.Set("messages_no", stat.messages_no);
        obj.Set("messages_recent", stat.messages_recent);
        obj.Set("messages_unseen", stat.messages_unseen);
        obj.Set("uid_next", stat.uid_next);
        obj.Set("uid_validity", stat.uid_validity);
        return obj;
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::StatisticsByList(const CallbackInfo& info) {
    try {
        Array folders = info[0].As<Array>();
        std::list<std::string> folder_list;
        for (uint32_t i = 0; i < folders.Length(); ++i)
            folder_list.push_back(folders.Get(i).As<String>().Utf8Value());
        unsigned int info_flags = info[1].As<Number>().Uint32Value();
        mailio::imaps::mailbox_stat_t stat = imap_client_->statistics(folder_list, info_flags);
        Object obj = Object::New(info.Env());
        obj.Set("messages_no", stat.messages_no);
        obj.Set("messages_recent", stat.messages_recent);
        obj.Set("messages_unseen", stat.messages_unseen);
        obj.Set("uid_next", stat.uid_next);
        obj.Set("uid_validity", stat.uid_validity);
        return obj;
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::FolderDelimiter(const CallbackInfo& info) {
    try {
        std::string delim = imap_client_->folder_delimiter();
        return String::New(info.Env(), delim);
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::FetchOne(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected (mailbox: string, index: number)").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        std::string mailbox = info[0].As<Napi::String>();
        uint32_t index = info[1].As<Napi::Number>().Uint32Value();

        mailio::message msg;
        imap_client_->fetch(mailbox, index, msg);  // 기본값: is_uid=false, header_only=false

        std::string content;
        msg.format(content);

        return Napi::String::New(env, content);

    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Value ImapWrapper::FetchByUid(const CallbackInfo& info) {
    try {
        std::string mailbox = info[0].As<String>();
        uint32_t uid = info[1].As<Number>().Uint32Value();
        mailio::message msg;
        imap_client_->fetch(mailbox, uid, true, msg);
        std::string content;
        msg.format(content);
        return String::New(info.Env(), content);
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::RemoveOne(const CallbackInfo& info) {
    try {
        std::string mailbox = info[0].As<String>();
        uint32_t index = info[1].As<Number>().Uint32Value();
        imap_client_->remove(mailbox, index);
        return info.Env().Undefined();
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::RemoveByUid(const CallbackInfo& info) {
    try {
        std::string mailbox = info[0].As<String>();
        uint32_t uid = info[1].As<Number>().Uint32Value();
        imap_client_->remove(mailbox, uid, true);
        return info.Env().Undefined();
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::AppendMessage(const CallbackInfo& info) {
    try {
        std::string mailbox = info[0].As<String>();
        std::string raw = info[1].As<String>();
        mailio::message msg;
        msg.parse(raw);
        imap_client_->append(mailbox, msg);
        return info.Env().Undefined();
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::AppendByList(const CallbackInfo& info) {
    try {
        Array folderArray = info[0].As<Array>();
        std::list<std::string> folderList;
        for (uint32_t i = 0; i < folderArray.Length(); ++i)
            folderList.push_back(folderArray.Get(i).As<String>().Utf8Value());
        std::string raw = info[1].As<String>();
        mailio::message msg;
        msg.parse(raw);
        imap_client_->append(folderList, msg);
        return info.Env().Undefined();
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::SearchMessages(const CallbackInfo& info) {
    try {
        std::string keyword = info[0].As<String>();
        std::list<mailio::imaps::search_condition_t> conditions = {
            mailio::imaps::search_condition_t(mailio::imaps::search_condition_t::SUBJECT, keyword)
        };
        std::list<unsigned long> results;
        imap_client_->search(conditions, results);
        Array arr = Array::New(info.Env(), results.size());
        uint32_t i = 0;
        for (auto id : results)
            arr.Set(i++, Number::New(info.Env(), id));
        return arr;
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::SearchByUid(const CallbackInfo& info) {
    try {
        std::string keyword = info[0].As<String>();
        std::list<mailio::imaps::search_condition_t> conditions = {
            mailio::imaps::search_condition_t(mailio::imaps::search_condition_t::SUBJECT, keyword)
        };
        std::list<unsigned long> results;
        imap_client_->search(conditions, results, true);
        Array arr = Array::New(info.Env(), results.size());
        uint32_t i = 0;
        for (auto id : results)
            arr.Set(i++, Number::New(info.Env(), id));
        return arr;
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::CreateFolder(const CallbackInfo& info) {
    try {
        std::string name = info[0].As<String>();
        bool result = imap_client_->create_folder(name);
        return Boolean::New(info.Env(), result);
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::DeleteFolder(const CallbackInfo& info) {
    try {
        std::string name = info[0].As<String>();
        bool result = imap_client_->delete_folder(name);
        return Boolean::New(info.Env(), result);
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::RenameFolder(const CallbackInfo& info) {
    try {
        std::string old_name = info[0].As<String>();
        std::string new_name = info[1].As<String>();
        bool result = imap_client_->rename_folder(old_name, new_name);
        return Boolean::New(info.Env(), result);
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::ListFolders(const CallbackInfo& info) {
    try {
        std::string name = info[0].As<String>();
        mailio::imaps::mailbox_folder_t folders = imap_client_->list_folders(name);
        Object root = Object::New(info.Env());
        std::function<void(Object&, const mailio::imaps::mailbox_folder_t&)> buildTree;
        buildTree = [&](Object& obj, const mailio::imaps::mailbox_folder_t& tree) {
            for (const auto& [k, v] : tree.folders) {
                Object child = Object::New(info.Env());
                buildTree(child, v);
                obj.Set(k, child);
            }
        };
        buildTree(root, folders);
        return root;
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}

Value ImapWrapper::ListFoldersByList(const CallbackInfo& info) {
    try {
        Array folders = info[0].As<Array>();
        std::list<std::string> folder_list;
        for (uint32_t i = 0; i < folders.Length(); ++i)
            folder_list.push_back(folders.Get(i).As<String>().Utf8Value());
        mailio::imaps::mailbox_folder_t result = imap_client_->list_folders(folder_list);
        Object root = Object::New(info.Env());
        std::function<void(Object&, const mailio::imaps::mailbox_folder_t&)> buildTree;
        buildTree = [&](Object& obj, const mailio::imaps::mailbox_folder_t& tree) {
            for (const auto& [k, v] : tree.folders) {
                Object child = Object::New(info.Env());
                buildTree(child, v);
                obj.Set(k, child);
            }
        };
        buildTree(root, result);
        return root;
    } catch (std::exception& e) {
        throw Error::New(info.Env(), e.what());
    }
}