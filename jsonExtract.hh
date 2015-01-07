//
//
// jsonExtract.hh
//

#ifndef JSONEXTRACT_HH
#define JSONEXTRACT_HH

#include "annealInfo.hh"
#include "json.hh"
#include <exception>

using namespace std;

AnnealInfo* json_to_anneal_info(JSONValue* value);

class ConstraintException : public std::exception {
private:
    string message;
public:

    ConstraintException(const char* mesg);
    ConstraintException(const char* mesg1, const char* mesg2);
    ConstraintException(const char* mesg1, const string& mesg2);

    virtual const char* what() const noexcept;
};

#endif
