//
// jsonExceptions.cpp
//

#include "jsonExceptions.hh"
#include <sstream>

//////////////////////////////////////////////////////////////////////////////
// JSONException

const char* JSONException::what() const noexcept
{
    return message.c_str();
}

//////////////////////////////////////////////////////////////////////////////
// UnexpectedCharacterJSONException
UnexpectedCharacterJSONException::UnexpectedCharacterJSONException(StringCursor& cursor)
{
    std::stringstream s;
    
    if(*cursor) {
	s << "Unexpected character '" << *cursor << "' at " << cursor;
    } else {
	s << "Unexpected end-of-file at " << cursor;
    }
    message = s.str();
}

UnexpectedCharacterJSONException::UnexpectedCharacterJSONException(StringCursor& cursor, char expectedChar)
{
    std::stringstream s;
    
    if(*cursor) {
	s << "Expected '" << expectedChar << "' but got '" << *cursor << "' at " << cursor;
    } else {
	s << "Expected '" << expectedChar << "' but end-of-file at " << cursor;
    }
    message = s.str();
}

//////////////////////////////////////////////////////////////////////////////
// MissingJSONValueException
MissingJSONValueException::MissingJSONValueException(StringCursor& cursor)
{
    std::stringstream s;
    
    s << "Expected a JSON value after string at " << cursor;
    message = s.str();
}

//////////////////////////////////////////////////////////////////////////////
// UnicodeJSONException
UnicodeJSONException::UnicodeJSONException(StringCursor& cursor)
{
    std::stringstream s;
    
    s << "Unicode characters not supported at " << cursor;
    message = s.str();
}

///////////////////////////////////////////////////////////////////////////////
// MissingAttributeException
MissingAttributeException::MissingAttributeException(string& mesg)
{
    message = mesg;
}
