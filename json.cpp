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

// Indent manipulator related functions
int get_indent_manipulator_index() {
    static int index = ios_base::xalloc();
    return index;
}

ios_base& increase_indent(ios_base& stream) {
    stream.iword(get_indent_manipulator_index())++;
    return stream;
}

ios_base& decrease_indent(ios_base& stream) {
    stream.iword(get_indent_manipulator_index())--;
    return stream;
}

ostream& indent(ostream& stream) {
    int indent_level = stream.iword(get_indent_manipulator_index());
    while(indent_level >= 4) {
	stream << '\t';
	indent_level -= 4;
    }
    while(indent_level > 0) {
	stream << "  ";
	--indent_level;
    }
    return stream;
}

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
	obj->append(name->get_value(), value);

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

const char* JSONValue::type_to_string(JSONType t)
{
    switch(t) {
	case JSON_STRING : return "string";
	case JSON_NUMBER : return "number";
	case JSON_OBJECT : return "object";
	case JSON_ARRAY : return "array";
	case JSON_BOOL : return "bool";
	case JSON_NULL : return "null";
	default:
	    assert("Invalid JSONType");
    }
}

JSONValue::JSONValue(JSONType t)
	: type(t)
{
}

JSONValue::~JSONValue()
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

// Type getter
JSONType JSONValue::get_type()
{
    return type;
}

bool JSONValue::has_type(JSONType t)
{
    return (t == type);
}

bool JSONValue::is_array() 	{ return (type == JSON_ARRAY); }
bool JSONValue::is_object() 	{ return (type == JSON_OBJECT); }
bool JSONValue::is_string() 	{ return (type == JSON_STRING); }
bool JSONValue::is_number() 	{ return (type == JSON_NUMBER); }
bool JSONValue::is_bool() 	{ return (type == JSON_BOOL); }
bool JSONValue::is_null()	{ return (type == JSON_NULL); }
bool JSONValue::is_compound_object() { return ((type == JSON_ARRAY) || (type == JSON_OBJECT)); }

bool JSONValue::match(const string& str)
{
    if(type == JSON_STRING) {
	JSONString* stringValue = (JSONString*)this;
	return stringValue->match(str);
    } else {
	return false;
    }
}

bool JSONValue::match(double d)
{
    if(type == JSON_NUMBER) {
	JSONNumber* numValue = (JSONNumber*)this;
	return numValue->match(d);
    } else {
	return false;
    }
}

///////////////////////////////////////////////////////////////////////////////
// JSONString
JSONString::JSONString(string val) :
	JSONValue(JSON_STRING),
	value(val)
{
}

bool JSONString::match(const string& str)
{
    return (str == value);
}

const string& JSONString::get_value()
{
    return value;
}

void JSONString::set_value(const string& str)
{
    value = str;
}

void JSONString::print(ostream& str) const
{
    // NEED to fix this to escape characters appropriately.
    str << '"' << value << "\"";
}

///////////////////////////////////////////////////////////////////////////////
// JSONNumber

// Constructors
JSONNumber::JSONNumber() :
	JSONValue(JSON_NUMBER),
	value(0.0)
{
}

JSONNumber::JSONNumber(double d) :
	JSONValue(JSON_NUMBER),
	value(d)
{
}

bool JSONNumber::match(double d)
{
    return (value == d);
}

double JSONNumber::get_value() 
{
    return value;
}

void JSONNumber::set_value(double d)
{
    value = d;
}

void JSONNumber::print(ostream& str) const
{
    str << value;
}

///////////////////////////////////////////////////////////////////////////////
// JSONObject

// Constructor
JSONObject::JSONObject(void) :
	JSONValue(JSON_OBJECT)
{
}

// Destructor
JSONObject::~JSONObject()
{
    Iterator itr = iterator();
    while(itr != end()) {
	delete itr->second;
	++itr;
    }
}

void JSONObject::append(const string& name, JSONValue* const value)
{
    nameValuePairs.insert(make_pair(name, value));
}

JSONString* JSONObject::append(const string& name, const string& value)
{
    JSONString* stringValue = new JSONString(value);
    nameValuePairs.insert(make_pair(name, stringValue));
    return stringValue;
}

JSONNumber* JSONObject::append(const string& name, double d)
{
    JSONNumber* numberValue = new JSONNumber(d);
    nameValuePairs.insert(make_pair(name, numberValue));
    return numberValue;
}

JSONBool* JSONObject::append(const string& name, bool b)
{
    JSONBool* boolValue = new JSONBool(b);
    nameValuePairs.insert(make_pair(name, boolValue));
    return boolValue;
}

void JSONObject::append_null(const string& name)
{
    nameValuePairs.insert(make_pair(name, new JSONNull()));
}

bool JSONObject::has_attribute(const string& name)
{
    map<string,JSONValue*>::iterator it = nameValuePairs.find(name);
    return(it != nameValuePairs.end());
}

JSONValue* JSONObject::find(const string& name)
{
    map<string,JSONValue*>::iterator it = nameValuePairs.find(name);
    if(it != nameValuePairs.end()) {
	return it->second;
    } else {
	string mesg = "Expected to find attribute ";
	mesg += name;
	throw MissingAttributeException(mesg);
    }
}

JSONValue* JSONObject::find(const string& name, JSONType type)
{
    map<string,JSONValue*>::iterator it = nameValuePairs.find(name);
    if(it != nameValuePairs.end() && it->second->has_type(type)) {
	return it->second;
    } else {
	string mesg = "Expected to find attribute ";
	mesg += name;
	mesg += " of type ";
	mesg += type_to_string(type);
	throw MissingAttributeException(mesg);
    }
}

double JSONObject::find_number(const string& name)
{
    JSONValue* value = find(name, JSON_NUMBER);
    return ((JSONNumber*)value)->get_value();
}

const string& JSONObject::find_string(const string& name)
{
    JSONValue* value = find(name, JSON_STRING);
    return ((JSONString*)value)->get_value();
}

JSONObject::Iterator JSONObject::iterator()
{
    return nameValuePairs.begin();
}

JSONObject::Iterator JSONObject::end()
{
    return nameValuePairs.end();
}

void JSONObject::print(ostream& str) const
{
    str << "{" << increase_indent << endl;
    bool first = true;
    for(map<string,JSONValue*>::const_iterator it = nameValuePairs.begin(); 
	    it != nameValuePairs.end(); it++) {
	if(!first) {
	    str << "," << endl;
	}
	str << indent << '"' << it->first << '"' << " : " << *(it->second);
	first = false;
    }
    str << endl << decrease_indent << indent << "}";
}

///////////////////////////////////////////////////////////////////////////////
// JSONArray

// Constructor
JSONArray::JSONArray(void) : 
	JSONValue(JSON_ARRAY)
{
}

// Destructor
JSONArray::~JSONArray()
{
    Iterator itr = iterator();
    while(itr != end()) {
	delete *itr;
	++itr;
    }
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

JSONString* JSONArray::append(const string& value)
{
    JSONString* stringValue = new JSONString(value);
    members.push_back(stringValue);
    return stringValue;
}

JSONNumber* JSONArray::append(double d)
{
    JSONNumber* numberValue = new JSONNumber(d);
    members.push_back(numberValue);
    return numberValue;
}

JSONBool* JSONArray::append(bool b)
{
    JSONBool* boolValue = new JSONBool(b);
    members.push_back(boolValue);
    return boolValue;
}

void JSONArray::append_null()
{
    members.push_back(new JSONNull());
}

JSONArray::Iterator JSONArray::iterator()
{
    return members.begin();
}

JSONArray::Iterator JSONArray::end()
{
    return members.end();
}

void JSONArray::print(ostream& str) const
{
    str << increase_indent << "[ ";
    bool first = true;
    bool arrayOfSimpleTypes = true;
    for(vector<JSONValue* const>::iterator it = members.begin();
	    it != members.end(); it++) {
	arrayOfSimpleTypes = arrayOfSimpleTypes && !((*it)->is_compound_object());
	if(first) {
	    if(arrayOfSimpleTypes) {
		str << **it;
	    } else {
		str << endl << indent << **it;
	    }
	} else {
	    if(arrayOfSimpleTypes) {
		str << ", " << **it;
	    } else {
		str << "," << endl << indent << **it;
	    }
	}
	first = false;
    }
    if(arrayOfSimpleTypes) {
	str << " ]" << decrease_indent;
    } else {
	str << endl << decrease_indent << indent << "]";
    }
}

///////////////////////////////////////////////////////////////////////////////
// JSONBool
JSONBool::JSONBool(bool val) :
	JSONValue(JSON_BOOL),
	value(val)
{
}

void JSONBool::set_value(bool val)
{
    value = val;
}

bool JSONBool::get_value() 
{
    return value;
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

