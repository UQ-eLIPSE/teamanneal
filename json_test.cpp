//
// json_test.cpp
//
// Module for testing json routines

#include <iostream>
#include "json.hh"
#include <string>
using namespace std;

int main(int argc, char* argv[])
{
    JSONValue* value;
    if(argc < 2) {
	cerr << "Usage: " << argv[0] << " filename" << endl;
	exit(1);
    }
    try {
	value = JSONArray::readJSON(argv[1]);
	cout << *value << endl;
    }
    catch(std::exception& e) {
	cerr << argv[0] << ": " << e.what() << endl;
    }
}
