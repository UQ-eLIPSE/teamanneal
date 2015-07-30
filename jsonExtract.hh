//
//
// jsonExtract.hh
//

#ifndef JSONEXTRACT_HH
#define JSONEXTRACT_HH

#include "annealinfo.hh"
#include "json.hh"
#include <exception>

using namespace std;

// The given JSONValue must be an object and must have an attribute "identifier" which is 
// a string. This function returns the value of that string attribute, or throws an exception
// if the value is not an object OR it doesn't contain an "identifier" attribute OR the
// the attribute value is not a string
const string& get_identifier_from_json_object(JSONValue* obj);

// Extract the constraints from the given JSON value and add them to our annealing information
void extract_constraints_from_json_data(AnnealInfo& annealInfo, JSONValue* value);

class ConstraintException : public std::exception {
private:
    string message;
public:

    ConstraintException(const char* mesg);
    ConstraintException(const char* mesg1, const char* mesg2);
    ConstraintException(const char* mesg1, const string& mesg2);
    ConstraintException(const char* mesg1, double d);

    virtual const char* what() const noexcept;
};

#endif
