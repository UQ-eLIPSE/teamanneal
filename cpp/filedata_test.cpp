//
// filedata_test.cpp
//
// Program to test the FileData class - reading a file and printing its size.

#include "exceptions.hh"
#include "filedata.hh"
#include <iostream>
#include <stdlib.h>	// for exit()

int main(int argc, char* argv[]) {
    if(argc != 2) {
	cerr << "Usage: " << argv[0] << " filename" << endl;
	exit(1);
    }

    FileData* filedata;
    try {
	filedata = new FileData(argv[1]);
    } catch (FileException& e) {
	cerr << argv[0] << ": " << e.what() << endl;
	exit(2);
    } 
    cout << "File size: " << filedata->getSize() << endl;
    return 0;
}
