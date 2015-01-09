//
// json.hh
//

#ifndef JSON_HH
#define JSON_HH

#include <vector>
#include <map>
#include <iostream>
#include <utility>	// for pair<>

using namespace std;

typedef enum { JSON_STRING, JSON_NUMBER, JSON_OBJECT, JSON_ARRAY, JSON_BOOL, JSON_NULL } JSONType;

///////////////////////////////////////////////////////////////////////////////
// Virtual base class
class JSONValue {
public:
    JSONType type;
    static const char* type_to_string(JSONType type);

    // Constructor
    JSONValue(JSONType t);

    // Factory method - construct a JSONValue from the contents of a file.
    static JSONValue *readJSON(const char *filename);

    // Output operator
    friend ostream& operator<<(ostream& stream, const JSONValue& v);

    // Other member functions
    JSONType get_type();
    bool has_type(JSONType type);
    bool is_array();
    bool is_object();
    bool is_string();
    bool is_number();
    bool is_bool();

    // Returns true if the JSON value is a string which matches the given string str
    bool match(const string& str);
    // Returns true if the JSON value is a number which matches the given value
    bool match(double d);
protected:
    // Print method that will be defined by all child classes
    virtual void print(ostream& str) const = 0;
};

///////////////////////////////////////////////////////////////////////////////
class JSONString: public JSONValue {
private:
    string value;
public:

    // Constructor
    JSONString(string val);

    // Other member functions
    bool match(const string& str);
    const string& get_value();
    void set_value(const string& str);

protected:
    // Output function
    void print(ostream& str) const override;
};

///////////////////////////////////////////////////////////////////////////////
class JSONNumber: public JSONValue {
private:
    double value;
public:

    // Constructor
    JSONNumber(double d);

    // Other member functions
    // Returns true if the value matches that in d, false otherwise
    bool match(double d);
    double get_value();
    void set_value(double d);
protected:
    // Output function
    void print(ostream& str) const override;
};

///////////////////////////////////////////////////////////////////////////////
class JSONObject: public JSONValue { 
public:
    typedef map<string,JSONValue*>::iterator Iterator;

    map<string,JSONValue*> nameValuePairs;

    // Constructor
    JSONObject(void);

    // Other member functions
    // Append
    void append(const string& name, JSONValue* const value);

    // Returns whether the object has an attribute with the given name
    bool has_attribute(const string& name);

    // Find an attribute with the given name and return its value 
    // - throws MissingAttributeException if not found
    JSONValue* find(const string& name);
    // Find an attribute with the given name and type - throws MissingAttributeException 
    // if not found
    JSONValue* find(const string& name, JSONType type);
    // Find a number attribute with the given name and return the value. Throw
    // MissingAttributeException if not found or not a number
    double find_number(const string& name);
    // Find a string attribute with the given name and return a reference to the string.
    // Throw MissingAttributeException if not found or not a string
    const string& find_string(const string& name);

    // Return an iterator over the map
    Iterator iterator();
    // Return an iterator to the end
    Iterator end();

protected:
    // Output function
    void print(ostream& str) const override;
};

///////////////////////////////////////////////////////////////////////////////
class JSONArray: public JSONValue {
public:
    typedef vector<JSONValue*>::iterator Iterator;

    vector<JSONValue*> members;

    // Constructor
    JSONArray(void);

    // Other member functions
    // Append operator
    JSONArray& operator+=(JSONValue* const rhs);
    void append(JSONValue* const rhs);

    // Return an iterator to the beginning of the array
    Iterator iterator();
    // Return an iterator to the end of the array
    Iterator end();

protected:
    // Output function
    void print(ostream& str) const override;
};

///////////////////////////////////////////////////////////////////////////////
class JSONBool: public JSONValue {
protected:
    bool value;

public:
    // Constructor
    JSONBool(bool val);

    // Other member functions
    void set_value(bool val);
    bool get_value();

protected:
    // Output function
    void print(ostream& str) const override;
};

///////////////////////////////////////////////////////////////////////////////
class JSONNull: public JSONValue {
public:
    // Constructor
    JSONNull(void);

protected:
    // Output function
    void print(ostream& str) const override;
};


#endif
