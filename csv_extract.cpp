/*
 * csv_extract.cpp
 */

#include "csv_extract.hh"
#include <assert.h>

using namespace std;

void extract_people_and_attributes_from_csv_data(AnnealInfo& annealInfo, CSV_File* data, const string& idField) {
    /* Deal with the attributes first */
    int idFieldNum = -1;
    for(int col = 0; col<data->num_cols(); col++) {
	// Work out type of column
        Attribute::Type t = Attribute::STRING;
        if(data->columns[col]->type == CSV_Column::NUMBER) {
            t = Attribute::NUMERICAL;
        }
	Attribute* attr = new Attribute(data->columns[col]->name, t);
	annealInfo.add_attribute(attr);

        if(idField == data->columns[col]->name) {
	    // This column name matches our ID field - specify this attribute as the id field
	    // and keep track of the column number
	    annealInfo.set_id_attribute(attr);
            idFieldNum = col;
        }
    }
    // Must have a field with the name given as the ID field
    assert(idFieldNum >= 0);

    /* Now deal with each person */
    for(int row=0; row<data->num_rows(); row++) {
	// Find the ID of this person and create the empty person object
        string& id = data->rows[row]->cells[idFieldNum]->str;
        Person* person = new Person(id);

	// For each column in the CSV file, add this data as an attribute 
	// to our person - either a string attribute or a numerical attribute
        for(int col=0; col<data->numColumns; col++) {
	    Attribute* attr = annealInfo.get_attribute(col);
	    // Add the value of this attribute for this person as one of the possible values for the 
	    // attribute
	    int attributeIndex = attr->add_value(string(data->rows[row]->cells[col]->str));
	    // Record the attribute value pair for this person. All values get recorded as strings
	    // but numbers also get recorded as number. 
	    person->add_attribute_value_pair(attr, attributeIndex);
            if(data->columns[col]->type == CSV_Column::NUMBER) {
                person->add_attribute_value_pair(attr, data->rows[row]->cells[col]->d);
		attr->update_numeric_range_to_include(data->rows[row]->cells[col]->d);
            }
        }

	// Add this person to our list of people
	annealInfo.add_person(person);
    }
}
