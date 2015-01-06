/*
 * csv_extract_test.cpp
 */

#include "csv_extract.hh"
#include "person.hh"
#include "attribute.hh"
#include <iostream>
#include "filedata.hh"
#include <stdlib.h>

extern "C" {
#include "csv.h"
}

using namespace std;

int main(int argc, const char* argv[]) {
    int printAttributes = 0;

    if(argc >= 2 && string(argv[1]) == "-attributes") {
        printAttributes = 1;
        // Remove argument - shuffle others along (including terminating NULL in array)
        for(int i=2; i <= argc; i++) {
            argv[i-1] = argv[i];
        }
        argc--;
    }
    if(argc != 2) {
	cerr << "Usage: " << argv[0] << " [-attributes] team-data-csv-file" << endl;
	exit(1);
    }

    FileData* teamfiledata;
    try {
	teamfiledata = new FileData(argv[1]);
    } catch (std::exception& e) {
	cerr << argv[0] << ": " << e.what() << endl;
	exit(2);
    }
    CSV_File* teamfile = process_csv_file(teamfiledata->getContents(), ',', '"',1);

    vector<Person>* list = csv_to_person_list(teamfile, string("StudentID"));

    if(printAttributes) {
        cout << teamfile->numColumns << "," << teamfile->numRows << endl;
        cout << allAttributes;
    } else {
        cout << "Person list" << endl;
        for(vector<Person>::const_iterator i = list->begin(); i != list->end(); i++) {
            cout << *i << endl;
        }
    }
    return 0;
}
