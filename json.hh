//
// json.hh
//

#ifndef JSON_HH
#define JSON_HH

#include <vector>
#include <iostream>
#include <utility>	// for pair<>

using namespace std;

typedef enum { JSON_STRING, JSON_NUMBER, JSON_OBJECT, JSON_ARRAY, JSON_BOOL, JSON_NULL } JSONType;

class JSONValue;
typedef pair<string,JSONValue*> JSONPair;

// Virtual base class
class JSONValue {
public:
    JSONType type;

    // Constructor
    JSONValue(JSONType t);

    // Factory method - construct a JSONValue from the contents of a file.
    static JSONValue *readJSON(const char *filename);

    // Output operator
    friend ostream& operator<<(ostream& stream, const JSONValue& v);

protected:
    // Print method that will be defined by all child classes
    virtual void print(ostream& str) const = 0;
};

class JSONString: public JSONValue {
public:
    string value;

    // Constructor
    JSONString(string val);

    // Output function
    void print(ostream& str) const override;
};

class JSONNumber: public JSONValue {
public:
    double value;

    // Constructor
    JSONNumber(double d);

protected:
    // Output function
    void print(ostream& str) const override;
};

class JSONObject: public JSONValue { 
public:
    vector<JSONPair> nameValuePairs;

    // Constructor
    JSONObject(void);

    // Append
    void append(const string& name, JSONValue* const value);

protected:
    // Output function
    void print(ostream& str) const override;
};

class JSONArray: public JSONValue {
public:
    vector<JSONValue*> members;

    // Constructor
    JSONArray(void);

    // Append operator
    JSONArray& operator+=(JSONValue* const rhs);
    void append(JSONValue* const rhs);

protected:
    // Output function
    void print(ostream& str) const override;
};

class JSONBool: public JSONValue {
public:
    bool value;

    // Constructor
    JSONBool(bool val);

protected:
    // Output function
    void print(ostream& str) const override;
};

class JSONNull: public JSONValue {
public:
    // Constructor
    JSONNull(void);

protected:
    // Output function
    void print(ostream& str) const override;
};


#endif
