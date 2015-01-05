//
// jsonExceptions.hh
//
//

#ifndef JSONEXCEPTIONS_HH
#define JSONEXCEPTIONS_HH

#include <exception>
#include <string>
#include "stringcursor.hh"

using namespace std;

class JSONException : public std::exception {
public:
    string message;

    virtual const char* what() const noexcept;
};

class UnexpectedCharacterJSONException : public JSONException {
public:
    UnexpectedCharacterJSONException(StringCursor& cursor);
    UnexpectedCharacterJSONException(StringCursor& cursor, char expectedChar);
};

class MissingJSONValueException : public JSONException {
public:
    MissingJSONValueException(StringCursor& cursor);
};

class UnicodeJSONException : public JSONException {
public:
    UnicodeJSONException(StringCursor& cursor);
};

#endif
