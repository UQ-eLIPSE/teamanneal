#include "person.hh"
#include <assert.h>

using namespace std;

Person::Person(string& s) :
    id(s) {}

void Person::add_attribute_value_pair(const string& attrName, const string& strValue) {
    // Find attribute in set of all attributes - it must be present
    Attribute* attr = allAttributes.find(attrName);
    assert(attr);

    // Add the value to the list of values associated with this attribute (it
    // it is already there then it won't be added again)
    attr->add_value(strValue);

    // Add the value to the set of string attributes for this person
    stringAttributes.insert( pair<Attribute,string>(*attr, strValue) );
}

void Person::add_attribute_value_pair(const string& attrName, const string& strValue, 
        const double numValue) {
    // Find attribute in set of all attributes - it must be present
    Attribute* attr = allAttributes.find(attrName);
    assert(attr);

    // Add the value to the list of values associated with this attribute (it
    // it is already there then it won't be added again)
    attr->add_value(strValue);

    // Add the value to the set of string attributes for this person
    numberAttributes.insert( pair<Attribute,double>(*attr, numValue) );
}

ostream& operator<<(ostream& os, const Person& p) {
    os << p.id;
    os << endl << "String attributes " << p.stringAttributes.size() << ":" << endl;
    for(map<Attribute,string>::const_iterator i = p.stringAttributes.begin(); 
            i != p.stringAttributes.end(); i++) {
        os << "  " << i->first.name << " : " << i->second << endl;
    }
    os << "Numerical attributes " << p.numberAttributes.size() << ":" << endl;
    for(map<Attribute,double>::const_iterator i = p.numberAttributes.begin(); 
            i != p.numberAttributes.end(); i++) {
        os << "  " << i->first.name << " : " << i-> second << endl;
    }
    return os;
}
