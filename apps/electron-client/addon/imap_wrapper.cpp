// imap_wrapper.cpp (헤더 및 초기화 포함)
#include "imap_wrapper.hpp"
#include <mailio/message.hpp>
#include <sstream>
#include <iostream> // 디버깅 로그용 (이미 있다면 생략)

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
        InstanceMethod("searchAll", &ImapWrapper::SearchAll),
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

    std::string mailbox_name_str;
    uint32_t index_val;

    try {
        mailbox_name_str = info[0].As<Napi::String>().Utf8Value();
        index_val = info[1].As<Napi::Number>().Uint32Value();
        // std::cerr << "[FetchOne] Received request for mailbox: " << mailbox_name_str << ", index: " << index_val << std::endl;
    } catch (const Napi::Error& e) {
        // std::cerr << "[FetchOne] NAPI argument conversion error: " << e.Message() << std::endl;
        e.ThrowAsJavaScriptException();
        return env.Null();
    }

    // !!! 인덱스 유효성 검사: 0번 인덱스 방어 !!!
    if (index_val == 0) {
        std::string error_msg = "FetchOne error: Index 0 is invalid for mailbox: " + mailbox_name_str;
        // std::cerr << "[FetchOne] " << error_msg << std::endl;
        Napi::Error::New(env, error_msg).ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        // std::cerr << "[FetchOne] Attempting to fetch from mailbox: " << mailbox_name_str << ", index: " << index_val << std::endl;
        mailio::message msg;
        imap_client_->fetch(mailbox_name_str, index_val, msg); // is_uid=false, header_only=false
        // std::cerr << "[FetchOne] Successfully fetched message. Index: " << index_val << std::endl;

        std::string content;
        msg.format(content);
        // std::cerr << "[FetchOne] Message formatted. Size: " << content.length() << std::endl;

        return Napi::String::New(env, content);

    } catch (const std::exception& e) { // mailio 예외도 std::exception을 상속하므로 여기서 잡힐 수 있음
        std::string error_details = "Exception during fetch: " + std::string(e.what()) +
                                   " (mailbox: " + mailbox_name_str + ", index: " + std::to_string(index_val) + ")";
        // std::cerr << "[FetchOne] " << error_details << std::endl; // 로그 필요시 주석 해제
        Napi::Error::New(env, error_details).ThrowAsJavaScriptException();
        return env.Null();
    } catch (...) { // 그 외 모든 알 수 없는 C++ 예외
        std::string error_details = "Unknown C++ exception during IMAP fetch (mailbox: " + mailbox_name_str + ", index: " + std::to_string(index_val) + ")";
        // std::cerr << "[FetchOne] " << error_details << std::endl;
        Napi::Error::New(env, error_details).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Value ImapWrapper::FetchByUid(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected (mailbox: string, uid: number)").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string mailbox_name_str;
    uint32_t uid_val;

    try {
        mailbox_name_str = info[0].As<Napi::String>().Utf8Value();
        uid_val = info[1].As<Napi::Number>().Uint32Value();
        std::cerr << "[FetchByUid] 시작: mailbox=" << mailbox_name_str << ", uid=" << uid_val << std::endl;
    } catch (const Napi::Error& e) {
        std::cerr << "[FetchByUid] 인자 변환 오류: " << e.Message() << std::endl;
        e.ThrowAsJavaScriptException();
        return env.Null();
    }

    // UID 값이 0인 경우 처리 (UID는 일반적으로 1 이상)
    uint32_t imap_uid = (uid_val == 0) ? 1 : uid_val;
    if (uid_val != imap_uid) {
        std::cerr << "[FetchByUid] UID 값 변환: " << uid_val << " → " << imap_uid << std::endl;
    }

    try {
        mailio::message msg;
        bool headerOnly = false;  // 첫 시도는 전체 메시지 가져오기
        
        // 첫 번째 시도: 전체 메시지 가져오기
        try {
            std::cerr << "[FetchByUid] UID " << imap_uid << " 가져오기 시도..." << std::endl;
            imap_client_->fetch(mailbox_name_str, imap_uid, true, msg, headerOnly);
            std::cerr << "[FetchByUid] 가져오기 성공, 메시지 포맷 시도 중..." << std::endl;
            
            std::string content;
            
            // 메시지 포맷 부분을 별도 try-catch로 분리
            try {
                msg.format(content);
                std::cerr << "[FetchByUid] 메시지 포맷 성공, 크기: " << content.length() << " bytes" << std::endl;
                return String::New(info.Env(), content);
            } catch (...) {
                std::cerr << "[FetchByUid] 메시지 포맷 실패, 기본 정보만 추출 시도..." << std::endl;
                
                // 메시지 포맷 실패 시 기본 메타데이터만 추출하여 반환
                std::stringstream limited_content;
                
                // from() 메서드는 mailboxes 객체를 반환
                const mailio::mailboxes& from = msg.from();
                if (!from.addresses.empty()) {
                    const mailio::mail_address& sender = from.addresses.at(0);
                    limited_content << "From: " << sender.name << " <" << sender.address << ">\r\n";
                } else {
                    limited_content << "From: [Unknown]\r\n";
                }
                
                // 수신자 처리
                const mailio::mailboxes& to = msg.recipients();
                if (!to.addresses.empty()) {
                    limited_content << "To: ";
                    for (size_t i = 0; i < to.addresses.size(); ++i) {
                        const mailio::mail_address& recipient = to.addresses.at(i);
                        limited_content << recipient.name << " <" << recipient.address << ">";
                        if (i < to.addresses.size() - 1) {
                            limited_content << ", ";
                        }
                    }
                    limited_content << "\r\n";
                }
                
                limited_content << "Subject: " << msg.subject() << "\r\n";
                limited_content << "Date: " << msg.date_time() << "\r\n\r\n";
                limited_content << "Message body could not be formatted. This may be due to complex HTML structure or non-standard encoding.\r\n";
                
                std::cerr << "[FetchByUid] 기본 정보 추출 성공" << std::endl;
                return String::New(info.Env(), limited_content.str());
            }
        } 
        // 전체 메시지 가져오기 실패 시, 헤더만 가져오기 시도
        catch (const std::exception& fullFetchError) {
            std::cerr << "[FetchByUid] 전체 메시지 가져오기 실패: " << fullFetchError.what() << std::endl;
            std::cerr << "[FetchByUid] 헤더만 가져오기 시도..." << std::endl;
            
            // 헤더만 가져오기
            mailio::message header_msg;
            imap_client_->fetch(mailbox_name_str, imap_uid, true, header_msg, true);  // true: header_only
            
            std::stringstream header_content;
            
            // from() 메서드가 반환하는 mailboxes 객체에서 첫 번째 주소 사용
            const mailio::mailboxes& from = header_msg.from();
            if (!from.addresses.empty()) {
                const mailio::mail_address& sender = from.addresses.at(0);
                header_content << "From: " << sender.name << " <" << sender.address << ">\r\n";
            } else {
                header_content << "From: [Unknown]\r\n";
            }
            
            // 수신자 처리
            const mailio::mailboxes& to = header_msg.recipients();
            if (!to.addresses.empty()) {
                header_content << "To: ";
                for (size_t i = 0; i < to.addresses.size(); ++i) {
                    const mailio::mail_address& recipient = to.addresses.at(i);
                    header_content << recipient.name << " <" << recipient.address << ">";
                    if (i < to.addresses.size() - 1) {
                        header_content << ", ";
                    }
                }
                header_content << "\r\n";
            }
            
            header_content << "Subject: " << header_msg.subject() << "\r\n";
            header_content << "Date: " << header_msg.date_time() << "\r\n\r\n";
            header_content << "[Only headers retrieved. Message body unavailable.]\r\n";
            
            std::cerr << "[FetchByUid] 헤더만 가져오기 성공" << std::endl;
            return String::New(info.Env(), header_content.str());
        }
    } catch (const mailio::imap_error& e) {
        std::cerr << "[FetchByUid] IMAP 프로토콜 에러: " << e.what() << std::endl;
        std::string error_details = "IMAP 프로토콜 에러 (UID 요청): " + std::string(e.what()) +
                                   " (mailbox: " + mailbox_name_str + ", uid: " + std::to_string(uid_val) + 
                                   ", imap_uid: " + std::to_string(imap_uid) + ")";
        Napi::Error::New(env, error_details).ThrowAsJavaScriptException();
        return env.Null();
    } catch (const mailio::message_error& e) {
        std::cerr << "[FetchByUid] 메시지 구문 분석 에러: " << e.what() << std::endl;
        std::string error_details = "메시지 구문 분석 에러 (UID 요청): " + std::string(e.what()) +
                                   " (mailbox: " + mailbox_name_str + ", uid: " + std::to_string(uid_val) + 
                                   ", imap_uid: " + std::to_string(imap_uid) + ")";
        Napi::Error::New(env, error_details).ThrowAsJavaScriptException();
        return env.Null();
    } catch (const std::runtime_error& e) {
        std::cerr << "[FetchByUid] 런타임 에러: " << e.what() << std::endl;
        std::string error_details = "런타임 에러 (UID 요청): " + std::string(e.what()) +
                                   " (mailbox: " + mailbox_name_str + ", uid: " + std::to_string(uid_val) + 
                                   ", imap_uid: " + std::to_string(imap_uid) + ")";
        Napi::Error::New(env, error_details).ThrowAsJavaScriptException();
        return env.Null();
    } catch (const std::exception& e) {
        std::cerr << "[FetchByUid] 표준 예외: " << e.what() << std::endl;
        std::string error_details = "표준 예외 (UID 요청): " + std::string(e.what()) +
                                   " (mailbox: " + mailbox_name_str + ", uid: " + std::to_string(uid_val) + 
                                   ", imap_uid: " + std::to_string(imap_uid) + ")";
        Napi::Error::New(env, error_details).ThrowAsJavaScriptException();
        return env.Null();
    } catch (...) {
        std::cerr << "[FetchByUid] 알 수 없는 예외 발생!" << std::endl;
        
        // 현재 예외 정보 획득 시도
        try {
            std::cerr << "[FetchByUid] 현재 예외 정보 획득 시도..." << std::endl;
            std::rethrow_exception(std::current_exception());
        } catch (const std::exception& nested) {
            std::cerr << "[FetchByUid] 중첩된 예외 정보: " << nested.what() << std::endl;
        } catch (...) {
            std::cerr << "[FetchByUid] 중첩된 예외 정보를 얻을 수 없음" << std::endl;
        }
        
        std::string error_details = "알 수 없는 C++ 예외 발생 (UID 요청) (mailbox: " + 
                                    mailbox_name_str + ", uid: " + std::to_string(uid_val) + 
                                    ", imap_uid: " + std::to_string(imap_uid) + ")";
        Napi::Error::New(env, error_details).ThrowAsJavaScriptException();
        return env.Null();
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

Napi::Value ImapWrapper::SearchAll(const Napi::CallbackInfo& info) {
    try {
        std::string mailbox = info[0].As<Napi::String>().Utf8Value();
        
        // 먼저 mailbox 선택
        imap_client_->select(mailbox);
        
        // "ALL" 조건으로 검색하기 위한 조건 생성
        std::list<mailio::imaps::search_condition_t> conditions;
        conditions.push_back(mailio::imaps::search_condition_t(
            mailio::imaps::search_condition_t::ALL, ""
        ));
        
        // 검색 결과를 저장할 리스트
        std::list<unsigned long> results;
        
        // 검색 실행 (UID 모드로 검색)
        imap_client_->search(conditions, results, true);
        
        // 결과를 JavaScript 배열로 변환
        Napi::Array arr = Napi::Array::New(info.Env(), results.size());
        uint32_t i = 0;
        for (const auto& uid : results) {
            arr.Set(i++, Napi::Number::New(info.Env(), uid));
        }
        
        return arr;
    } catch (const std::exception& e) {
        throw Napi::Error::New(info.Env(), e.what());
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