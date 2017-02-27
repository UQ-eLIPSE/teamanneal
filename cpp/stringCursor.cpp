//
// stringCursor.cpp
//

#include <ctype.h>
#include <assert.h>
#include "stringCursor.hh"

///////////////////////////////////////////////////////////////////////////////
// Constructors
StringCursor::StringCursor(char* string)
	: cursor(string), lineNum(1), charNum(1)
{
}

StringCursor::StringCursor(StringCursor& rhs)
{
    cursor = rhs.cursor;
    lineNum = rhs.lineNum;
    charNum = rhs.charNum;
}

char StringCursor::operator*() 
{
    return *cursor;
}

// Prefix increment
StringCursor& StringCursor::operator++()
{
    if(*cursor == '\n') {
	++lineNum;
	charNum = 1;
    } else {
	++charNum;
    }
    cursor++;
    return *this;
}

// Postfix increment
StringCursor StringCursor::operator++(int)
{
    // Copy the current value so we can return it
    StringCursor copyOfOriginal(*this);
    
    // Use the prefix operator (above) to update the cursor
    ++(*this);

    // Return the cursor as it was before the increment
    return copyOfOriginal;
}

// Output operator
ostream& operator<<(ostream& stream, const StringCursor& cursor)
{
    stream << "line " << cursor.lineNum << ':' << cursor.charNum;
    return stream;
}

void StringCursor::skip_whitespace() 
{
    // Whilst we haven't reached the end of the string and the current character is a whitespace
    // character then we move on to the next character. If we come across a newline character 
    // then we update the line number. We always update the character number within the line.
    while(*cursor && isspace(*cursor)) {
	if(*cursor == '\n') {
	    lineNum++;
	    charNum = 1;
	} else {
	    charNum++;
	}
	cursor++;
    }
}

bool StringCursor::at_end_of_string()
{
    return (*cursor == 0);
}

bool StringCursor::at_digit()
{
    return isdigit(*cursor);
}

bool StringCursor::match_and_skip(const char* lookfor)
{
    assert(lookfor);	// Must not be a null string
    assert(*lookfor);	// Must not be an empty string
    char* newCursor = cursor;
    int newLineNum = lineNum;
    int newCharNum = charNum;
    while(*lookfor) {
	if(*lookfor != *newCursor) {
	    // No match - just return, without skipping over anything.
	    return false;
	}
	assert(*newCursor);	// We're not yet at the end of the string we're searching
				// (if we were, we would just have returned false)

	// Move on to next character in the string we're looking for and 
	// the string we're searching. We update our line and character counters first
	if(*newCursor == '\n') {
	    ++newLineNum;
	    newCharNum = 1;
	} else {
	    ++newCharNum;
	}
	++lookfor;
	++newCursor;
    }
    // If we get here, it means we've exhausted the string we're searching for and each
    // character in it matches. We update our cursor and line/char counts to skip over
    // the matched text. We also skip over any whitespace.
    cursor = newCursor;
    lineNum = newLineNum;
    charNum = newCharNum;
    skip_whitespace();
    return true;
}

double StringCursor::extract_double()
{
    char* newCursor;
    double d = strtod(cursor, &newCursor);
    if(cursor == newCursor) {
	// Cursor has not advanced - no double was identified - this is an error
	throw("Double not found");
    }
    cursor = newCursor;
    skip_whitespace();
    return d;
}
