/*
 * csv_extract.hh
 */

#include "person.hh"
#include <vector>
#include <string>
extern "C" {
#include "csv.h"
}

using namespace std;

vector<Person>* csv_to_person_list(CSV_File* data, const string& idField);
