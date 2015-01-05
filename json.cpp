/* 
** json.cpp
**
** Classes and associated functions for reading a JSON object from a file.
** 
** NOTE:
** Does not handle NULL (0) characters in a string, nor Unicode character sequences
*/

#include <ctype.h>
#include <stdio.h>
#include <assert.h>
#include <iostream>

using namespace std;

#include "filedata.hh"
#include "json.hh"
#include "stringCursor.hh"
#include "exceptions.hh"
#include "jsonExceptions.hh"

// Helper functions 
static JSONValue* extractJSONValue(StringCursor& cursor);
static JSONArray* extractJSONArray(StringCursor& cursor);
static JSONObject* extractJSONObject(StringCursor& cursor);
static JSONNumber* extractJSONNumber(StringCursor& cursor);
static JSONString* extractJSONString(StringCursor& cursor);

// Extract the next JSON value from the given string. This function may be called recursively when
// returning an array or an object. The cursor is updated to point to the next character after any
// consumed text and any following whitespace. 
// If an error occurs (e.g unexpected character or end of string) then an exception is thrown.
// Returns NULL if we're at the end of the string
static JSONValue *extractJSONValue(StringCursor& cursor) 
{
    cursor.skip_whitespace();

    // Determine type of value that starts 
    if(cursor.at_end_of_string()) {
	return NULL;
    } else if(*cursor == '"') {
	return extractJSONString(++cursor);
    } else if(*cursor == '[') {
	return extractJSONArray(++cursor);
    } else if(*cursor == '{') {
	return extractJSONObject(++cursor);
    } else if(cursor.at_digit() || (*cursor == '-')) {
	return extractJSONNumber(cursor);
    } else if(cursor.match_and_skip("true")) {
	return new JSONBool(true);
    } else if(cursor.match_and_skip("false")) {
	return new JSONBool(false);
    } else if(cursor.match_and_skip("null")) {
	return new JSONNull();
    } else {
	// Unexpected character
	throw(UnexpectedCharacterJSONException(cursor));
    }
}

// Extract array from JSON - we've already found and skipped over the '[' character at the beginning.
static JSONArray* extractJSONArray(StringCursor& cursor) 
{
    JSONArray* arr = new JSONArray();
    // Skip over any whitespace - we're expecting a JSON value or an end-of-array character ']'
    cursor.skip_whitespace();
    // Extract data from our characters until we reach the end of the string (error) or the 
    // end of the array
    while(!cursor.at_end_of_string() && *cursor != ']') {
	// next character is not the end of the array - must have a member in our array
	JSONValue* member = extractJSONValue(cursor);
	arr->append(member);

	// If there is a comma, skip over it (and any following whitespace)
	cursor.match_and_skip(",");
    }
    if(*cursor != ']') {
	// Expected end-of-array character
	throw UnexpectedCharacterJSONException(cursor, ']');
    }
    // Skip over the ']' and any following whitespace
    cursor.match_and_skip("]");
    return arr;
}

// Extract object from JSON - we've already found and skipped over the '{' character at the beginning.
static JSONObject* extractJSONObject(StringCursor& cursor) 
{
    JSONObject* obj = new JSONObject();
    // Skip over any whitespace - we're expecting a string or an end-of-object character '}'
    cursor.skip_whitespace();

    while(!cursor.at_end_of_string() && *cursor != '}') {
	// Next character should be double quote - extract string
	if(*cursor != '"') {
	    throw UnexpectedCharacterJSONException(cursor, '"');
	}
	// Skip over the double quote, then extract the string
	++cursor;
	JSONString* name = extractJSONString(cursor);

	// Next character should be a colon (:) - skip it and any whitespace
	if(!cursor.match_and_skip(":")) {
	    throw UnexpectedCharacterJSONException(cursor, ':');
	}

	// Should now have a JSON value of any sort
	JSONValue* value = extractJSONValue(cursor);
	if(!value) {
	    // Didn't find a JSON Value
	    throw MissingJSONValueException (cursor);
	}
	obj->append(name->value, value);

	// next character should be , or }
	if(!cursor.match_and_skip(",") && (*cursor != '}')) {
	    throw UnexpectedCharacterJSONException(cursor);
	}
    }
    if(!cursor.match_and_skip("}")) {
	throw UnexpectedCharacterJSONException(cursor);
    }
    return obj;
}

static JSONNumber* extractJSONNumber(StringCursor& cursor) 
{
    return new JSONNumber(cursor.extract_double());
}

// Extract string from JSON - we've already found and skipped over the leading double quote
static JSONString* extractJSONString(StringCursor& cursor) 
{
    string str;
    while(!cursor.at_end_of_string() && *cursor != '"') {
	if(*cursor == '\\') {
	    // Found backslash - move on to next character
	    ++cursor;
	    if(*cursor == '"' || *cursor == '\\' || *cursor == '/') {
		str += *cursor;
	    } else if(*cursor == 'b') {
		str += '\b';
	    } else if(*cursor == 'f') {
		str += '\f';
	    } else if(*cursor == 'n') {
		str += '\n';
	    } else if(*cursor == 'r') {
		str += '\r';
	    } else if(*cursor == 't') {
		str += '\t';
	    } else if(*cursor == 'u') {
		// Throw exception - we don't deal with Unicode characters
		throw UnicodeJSONException(cursor);
	    }
	} else {
	    // Non escaped character - add it to the string 
	    str += *cursor;
	}
	// Move on to next character
	++cursor;
    }
    // Attempt to skip over the closing quote and any following whitespace
    if(!cursor.match_and_skip("\"")) {
	// Have reached end of data before reaching close quote at end of string
	// throw exception
	throw UnexpectedCharacterJSONException(cursor, '"');
    }
    return new JSONString(str);
}

///////////////////////////////////////////////////////////////////////////////
// Member functions

JSONValue::JSONValue(JSONType t)
	: type(t)
{
}

// Construct a JSONValue from a file
JSONValue* JSONValue::readJSON(const char *filename)
{
    FileData* filedata = new FileData(filename);

    StringCursor cursor(filedata->getContents());
    // Extract a JSON value from the file - which should be an object, i.e. within {}
    JSONValue* value = extractJSONValue(cursor);

    // Check that there is nothing left in the string 
    if(!cursor.at_end_of_string()) {
	throw UnexpectedCharacterJSONException(cursor);
    }

    delete filedata;

    return value;
}

// Output operator
ostream& operator<<(ostream& stream, const JSONValue& v)
{
    v.print(stream);
    return stream;
}

///////////////////////////////////////////////////////////////////////////////
// JSONString
JSONString::JSONString(string val) :
	JSONValue(JSON_STRING),
	value(val)
{
}

void JSONString::print(ostream& str) const
{
    // NEED to fix this to escape characters appropriately.
    str << '"' << value << "\" ";
}

///////////////////////////////////////////////////////////////////////////////
// JSONNumber
JSONNumber::JSONNumber(double d) :
	JSONValue(JSON_NUMBER),
	value(d)
{
}

void JSONNumber::print(ostream& str) const
{
    str << value << ' ';
}

///////////////////////////////////////////////////////////////////////////////
// JSONObject
JSONObject::JSONObject(void) :
	JSONValue(JSON_OBJECT)
{
}

void JSONObject::append(const string& name, JSONValue* const value)
{
    nameValuePairs.push_back(make_pair(name, value));
}

void JSONObject::print(ostream& str) const
{
    str << "{ ";
    bool first = true;
    for(vector<const JSONPair>::iterator it = nameValuePairs.begin(); 
	    it != nameValuePairs.end(); it++) {
	if(!first) {
	    str << ", ";
	}
	str << '"' << it->first << '"' << " : " << *(it->second);
	first = false;
    }
    str << "} ";
}

///////////////////////////////////////////////////////////////////////////////
// JSONArray
JSONArray::JSONArray(void) : 
	JSONValue(JSON_ARRAY)
{
}

JSONArray& JSONArray::operator+=(JSONValue* const rhs)
{
    append(rhs);
    return *this;
}

void JSONArray::append(JSONValue* const rhs)
{
    members.push_back(rhs);
}

void JSONArray::print(ostream& str) const
{
    str << "[ ";
    bool first = true;
    for(vector<JSONValue* const>::iterator it = members.begin();
	    it != members.end(); it++) {
	if(!first) {
	    str << ", ";
	}
	str << **it;
	first = false;
    }
    str << "] ";
}

///////////////////////////////////////////////////////////////////////////////
// JSONBool
JSONBool::JSONBool(bool val) :
	JSONValue(JSON_BOOL),
	value(val)
{
}

void JSONBool::print(ostream& str) const
{
    if(value) {
	str << "true ";
    } else {
	str << "false ";
    }
}

///////////////////////////////////////////////////////////////////////////////
// JSONNull
JSONNull::JSONNull(void) :
	JSONValue(JSON_NULL)
{
}

void JSONNull::print(ostream& str) const
{
    str << "null ";
}

