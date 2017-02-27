//
// stringCursor.hh
//	Class that provides a cursor through a string (char*)
//

#ifndef STRING_CURSOR_HH
#define STRING_CURSOR_HH

#include <iostream>
using namespace std;

class StringCursor {
private:
    char* cursor;
    int lineNum;	// line number (starts at 1)
    int charNum;	// character number within the line (starts at 1)
public:
    ///////////////////////////////////////////////////////////////////////////
    // Constructors
    ///////////////////////////////////////////////////////////////////////////
    StringCursor(char* string);
    StringCursor(StringCursor& rhs);	// Copy constructor

    ///////////////////////////////////////////////////////////////////////////
    // Operators
    ///////////////////////////////////////////////////////////////////////////
    char operator*();
    StringCursor& operator++();		// Prefix increment
    StringCursor operator++(int);	// Postfix increment
    friend ostream& operator<<(ostream& stream, const StringCursor& cursor);

    ///////////////////////////////////////////////////////////////////////////
    // Other member functions
    ///////////////////////////////////////////////////////////////////////////

    // Advance the cursor (if necessary) to the next non-whitespace character or the end of the string,
    // whichever comes first
    void skip_whitespace();

    // Return true if we've reached the end of the string, false otherwise
    bool at_end_of_string();

    // Return true if the character at the cursor is a digit, false otherwise. Cursor is unmoved.
    bool at_digit();

    // If the text at the cursor matches that in "lookfor" then skip over that text (and any following
    // whitespace) and return true. Otherwise, don't move the cursor and return false.
    bool match_and_skip(const char* lookfor);

    // Extract the double precision floating point number at the cursor location and return it.
    // Skip over those characters and any following whitespace.
    double extract_double();
};

#endif
