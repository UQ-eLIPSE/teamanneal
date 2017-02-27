/*
** csv_test.cpp
*/

#include "filedata.hh"
#include "exceptions.hh"
#include <iostream>
#include <stdlib.h>
#include "csv.hh"

using namespace std;

int main(int argc, char* argv[]) {
    if(argc != 2) {
	cerr << "Usage: " << argv[0] << " csv-file-name" << endl;
	exit(1);
    }

    FileData* filedata;
    try {
	filedata = new FileData(argv[1]);
    } catch (FileException& e) {
	cerr << argv[0] << ": " << e.what() << endl;
	exit(2);
    } 

    CSV_File* csvData = new CSV_File(filedata->getContents(), ',', '"',1);
    cout << *csvData;
    return 0;
}
