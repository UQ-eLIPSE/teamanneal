/*
 * csv_extract.cpp
 */

#include "person.hh"
#include "attribute.hh"
#include <vector>
#include <string>
#include <assert.h>
extern "C" {
#include "csv.h"
}

using namespace std;

vector<Person>* csv_to_person_list(CSV_File* data, const string& idField) {
    vector<Person> *list = new vector<Person>;

    /* Deal with the attributes first */
    int idFieldNum = -1;
    for(int col = 0; col<data->numColumns; col++) {
        Attribute::Type t = Attribute::STRING;
        if(data->columns[col].type == NUMBER) {
            t = Attribute::NUMERICAL;
        }
        if(idField == data->columns[col].name) {
            // Can't have already found the ID field
            assert(idFieldNum == -1);
            // This is our ID field - keep track of the column number
            idFieldNum = col;
        }
        allAttributes.add(data->columns[col].name, t);
    }
    // Must have a field with the name given as the ID field
    assert(idFieldNum >= 0);

    /* Now deal with each person */
    for(int row=0; row<data->numRows; row++) {
	// Find the ID of this person and create the empty person object
        string id = data->rows[row].cells[idFieldNum].str;
        Person person(id);

	// For each column in the CSV file, add this data as an attribute 
	// to our person - either a string attribute or a numerical attribute
        for(int col=0; col<data->numColumns; col++) {
            string colName = data->columns[col].name;
            if(data->columns[col].type == STRING) {
                person.add_attribute_value_pair(colName,
                        string(data->rows[row].cells[col].str));
            } else {
                person.add_attribute_value_pair(colName,
                        string(data->rows[row].cells[col].str),
                        data->rows[row].cells[col].d);
            }
        }

	// Add this person to our list of people
        list->push_back(person);
    }

    return list;
}
