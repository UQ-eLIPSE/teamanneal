/*
 * attribute.hh
 */

#ifndef ATTRIBUTE_HH
#define ATTRIBUTE_HH

#include <vector>
#include <string>
#include <map>
#include <iostream>
using namespace std;


class Attribute {
public:
    enum Type { NUMERICAL, STRING };
    typedef vector<const string>::iterator ValueIterator;

    string name;
    Attribute::Type type;
    vector<string> stringValues;		// Unique list of all possible values for this attribute
    map<string,int> valueToIndexMap;	
    pair<double,double> numericRange;		// Only valid for numeric constraints

    // Constructor
    Attribute(const string& name, Attribute::Type type);

    // Operators
//    bool operator <(const Attribute& rhs) const;
    friend ostream& operator<<(ostream& os, const Attribute& a);

    // Other Member Functions
    int add_value(const string& value);		// Returns position in stringValues of this value
    						// (new value will be added if necessary)
    void update_numeric_range_to_include(double d);	// Update the range to incorporate this value
    						// (numeric constraints only, value must be added 
						// separately as a string)
    const string& get_name() const;
    const string& get_string_value(int index) const;
    bool is_string() const;
    bool is_numeric() const;
    size_t num_values() const;
    void rename(const string& str);	// change the name of this attribute
    double get_numerical_min_value() const;
    double get_numerical_max_value() const;

    // Return an iterator to the beginning of the set of values
    ValueIterator iterator() const;
    // Return an iterator to the end of the set of values
    ValueIterator end() const;
};

#endif 

