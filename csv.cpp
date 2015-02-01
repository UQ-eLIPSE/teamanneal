/*
** csv.cpp
** TO FIX
**  - outputs messages to stderr using fprintf() - should throw exceptions on error
*/

#include "csv.hh"
#include <stdio.h>
#include <assert.h>
#include <stdlib.h>
#include <sstream>

/* Given the file contents pointed to by *bufPtr, return a pointer to the 
** beginning of the next line of data (i.e. *bufPtr) or NULL if there is
** no further data (i.e. **bufPtr is null). *bufPtr is advanced to just
** after any newline (or carriage return or newline-carriage return or
** carriage return-newline.
*/
static char* get_line(char** bufPtr) {
    char* linePtr;
    char* cursor;

    assert(bufPtr);
    assert(*bufPtr);
    cursor = *bufPtr;
    if(cursor[0] == '\0') {
	/* End of data */
	return NULL;
    }
    linePtr = cursor;

    while(cursor[0] != '\r' && cursor[0] != '\n' && cursor[0] != '\0') {
	cursor++;
    }
    if(cursor[0] == '\r' && cursor[1] == '\n') {
	cursor[0] = 0;
	cursor += 2;
    } else if(cursor[0] == '\n' && cursor[1] == '\r') {
	cursor[0] = 0;
	cursor += 2;
    } else if(cursor[0] == '\n' || cursor[0] == '\r') {
	cursor[0] = 0;
	cursor++;
    } /* else - found null character - end of data - unterminated line */

    *bufPtr = cursor;
    return linePtr;
}

/* Count the number of fields in the given null-terminated line.
*/
static int count_fields(char* line, char separator, char quote) {
    char* cursor;
    int fieldCount = 1;
    int withinQuotes = 0;
    int atFieldStart = 1;

    assert(line);
    cursor = line;
    if(quote && cursor[0] == quote) {
	withinQuotes = 1;
	cursor++;
    }
    while(cursor[0]) {
	if(!withinQuotes) {
	    if(cursor[0] == quote && atFieldStart) {
		withinQuotes = 1;
		atFieldStart = 0;
	    } else if(cursor[0] == separator) {
		fieldCount++;
		atFieldStart = 1;
	    } else {
		atFieldStart = 0;
	    }
	} else if(cursor[0] == quote) { // withinQuotes = 1
	    atFieldStart = 0;
	    // Expecting doubled quote or quote followed by separator or NULL (end of line)
	    if(quote && cursor[1] == quote) {
		cursor++;	// Skip over the double quote character
	    } else if(cursor[1] == separator || cursor[1] == '\0') {
		// We've reached the end of this field
		withinQuotes = 0;
	    }
	    // else incorrectly quoted field - but we don't throw an error here
	}
	cursor++;
    }
    return fieldCount;
}

/* Given the remaining line pointed to by *linePtr, return the next
** field. We return it's type. The value is placed in
** the structure pointed to by cellPtr. *linePtr is advanced to point
** to the beginning of the next field, or is set to NULL if we reach the
** end of the line. 
*/
static CSV_Column::Type get_field(char** linePtr, CSV_Cell* cellPtr, char separator, char quote) {
    char* cursor;
    char* writeCursor;
    char* field;
    char* firstCharAfterConversion;

    assert(*linePtr);
    cursor = *linePtr;
    field = cursor;

    if(quote && cursor[0] == quote) {
	/* Field is quoted - start from the next character. If we find any doubled quotes, we will turn
	** it into a single quote character (and have to move characters backwards in the string.
	*/
	cursor++;
	field = cursor;	// Field begins at the next character, not the quote.
	writeCursor = field;
	// Look for a quote character at the end
	while(cursor[0] && ( (cursor[0] == quote && cursor[1] == quote) || cursor[0] != quote) ) {
	    writeCursor[0] = cursor[0];
	    if(cursor[0] == quote && cursor[1] == quote) {
		cursor++;
	    }
	    cursor++;
	    writeCursor++;
	}
	// Expect to get here on a quote character followed by a non quote (should be separator
	// or end of line). Can only get here in this situation or have null character.
	if(cursor[0] == '\0' || (cursor[1] != separator && cursor[1] != '\0')) {
	    // Field was not properly quoted - error
	    *linePtr = NULL;	// Give up on this line
	    //printf("%s\n%s\n", field, cursor); fflush(stdout);
	    return CSV_Column::QUOTE_ERROR;
	}
	assert(cursor[0] == quote);
	cursor++;
	writeCursor[0] = 0;
    } else { /* Field is not quoted */
	/* Find the next separator - or end of string */
	while(cursor[0] != separator && cursor[0] != '\0') {
	    cursor++;
	}
    }
    if(cursor[0] == separator) {
	/* Replace the separator by a null to null terminate the string (in the non quoted case), and
	** make the linePtr point to the character after this.
	*/
	cursor[0] = 0;
	*linePtr = cursor+1;
    } else {
	assert(cursor[0] == '\0');
	/* Null character found - end of the line */
	*linePtr = NULL;
    }

    /* If cellPtr wasn't provided to us, we don't need to work out 
    ** the type of the field. We just return EMPTY.
    */
    if(!cellPtr) {
	return CSV_Column::EMPTY;
    }
    /* Work out the type of the field, set the value and return
    ** the appropriate type indicator.
    */
    cellPtr->str = field;
    cellPtr->d = 0.0;
    if(*field == '\0') {
	return CSV_Column::EMPTY;
    }
    cellPtr->d = strtod(field, &firstCharAfterConversion);
    if(cursor == firstCharAfterConversion) {
	/* Whole field was consumed - value was a number */
	return CSV_Column::NUMBER;
    }

    /* Return value isn't empty or a number - must be a string */
    return CSV_Column::STRING;
}

// Ouptut string in a manner suitable for a CSV file - i.e. if the string contains a 
// comma then we put double quotes around it. If such a string also contains a double
// quote character then we double it up.
static void output_string(ostream& os, const string& str) {
    if(str.find(',') != string::npos) {
	// Found ',' in string - enclose string in double quotes
	os << '"';
	// Output string character by character and replace double quotes by 
	// doubled double quotes
	string::const_iterator itr = str.begin();
	while(itr != str.end()) {
	    os << *itr;
	    if(*itr == '"') {
		os << '"';
	    }
	    ++itr;
	}
	// Final double quote enclosing the string
	os << '"';
    } else {
	// No comma in the string - just output it
	os << str;
    }
}

///////////////////////////////////////////////////////////////////////////////
// CSV_Cell

// Constructors
CSV_Cell::CSV_Cell() :
    d(0.0)
{
}

CSV_Cell::CSV_Cell(const string& str) :
    str(str), 
    d(0.0)
{
}

CSV_Cell::CSV_Cell(double d) :
    d(d)
{
    ostringstream ostr;

    ostr << d;
    str = ostr.str();
}

CSV_Cell::CSV_Cell(const char* str) : 
    str(str),
    d(0.0)
{
}

ostream& operator<<(ostream& os, const CSV_Cell& cell) {
    output_string(os, cell.str);
    return os;
}


///////////////////////////////////////////////////////////////////////////////
// CSV_Row

// Constructor
CSV_Row::CSV_Row()
{
}

void CSV_Row::append(CSV_Cell* cell) 
{
    cells.push_back(cell);
}

void CSV_Row::append(const string& str)
{
    cells.push_back(new CSV_Cell(str));
}

ostream& operator<<(ostream& os, const CSV_Row& row) {
    // For each cell, output its value
    for(int col = 0; col < row.cells.size(); col++) { 
	if(col != 0) {
	    os << ',';
	}
	os << *(row.cells[col]);
    }
    os << endl;
    return os;
}

///////////////////////////////////////////////////////////////////////////////
// CSV_Column

// Constructor
CSV_Column::CSV_Column(const string& name, CSV_Column::Type type) :
	name(name),
	type(type)
{
}

ostream& operator<<(ostream& os, const CSV_Column& col) {
    output_string(os, col.name);
    /*
    if(col.type == CSV_Column::STRING) {
	os << "(STRING)";
    } else if(col.type == CSV_Column::NUMBER) {
	os << "(NUMBER)";
    } else if(col.type == CSV_Column::EMPTY) {
	os << "(EMPTY)";
    } else {
	os << "(UNKNOWN)";
    }
    */
    return os;
}

///////////////////////////////////////////////////////////////////////////////
// CSV_File

// Constructor - empty structure - assumed to be a table
CSV_File::CSV_File() :
	table(true),
	numColumns(0)
{
}

// Constructor - populate from file
CSV_File::CSV_File(char* buffer, char separator, char quote, bool expectTable) :
	table(expectTable)
{
    char* bufPtr = buffer;
    char* cursor;
    int col, line, errorFound;
    CSV_Column::Type datatype;
    CSV_Row* rowPtr;

    assert(buffer);

    line = 0;
    if(expectTable) {
        cursor = get_line(&bufPtr);	/* first row - assumed to contain column names */
        line++;
        /* Work out the number of columns based on the number of fields in the first row. This will
        ** be valid if we're expecting a table of data, otherwise, this will not be relevant.
        */
        numColumns = count_fields(cursor, separator, quote);
	columns.reserve(numColumns);

        /* Populate the column names based on the values in the first row */
        for(col=0; col < numColumns; col++) {
            assert(cursor);
	    CSV_Cell* cellPtr = new CSV_Cell();
            if(get_field(&cursor, cellPtr, separator, quote) == CSV_Column::QUOTE_ERROR) {
                fprintf(stderr, "Line %d - error in quoted field\n", line);
                errorFound = 1;
            }
	    // Construct column with default type - we'll update the column type when we read the actual data,
	    // rather than the headings
	    columns.push_back(new CSV_Column(cellPtr->str, CSV_Column::EMPTY));
	    delete cellPtr;
        }
    } else {
        numColumns = 0;
    }
    /* Read all the remaining rows */
    errorFound = 0;
    while((cursor = get_line(&bufPtr))) {
        line++;
        /* Ensure we have enough space to store this row in our array of rows */
	rowPtr = new CSV_Row();
	rows.push_back(rowPtr);
	int cellNum = 0;
        while(cursor) {
	    CSV_Cell* cellPtr = new CSV_Cell();
	    rowPtr->append(cellPtr);
            datatype = get_field(&cursor, cellPtr, separator, quote);
            if(datatype == CSV_Column::QUOTE_ERROR) {
                fprintf(stderr, "Line %d - error in quoted field\n", line);
                errorFound = 1;
            } else if(expectTable && cellNum < numColumns &&
                    datatype > columns[cellNum]->type) {
                /* This is supposed to be a table and we haven't exceeded the column range
                ** and the type of the column is different to what we thought it was previously
                */
                columns[cellNum]->type = datatype;
            }
	    ++cellNum;
        }
        // Run out of fields in line. If this is a table, check we got the number expected
        if(expectTable && rowPtr->cells.size() != numColumns) {
            fprintf(stderr, "Line %d - got %d fields, expecting %d)\n",
                    line, (int)rowPtr->cells.size(), numColumns);
            errorFound = 1;
            break;
        }
        if(!expectTable && rowPtr->cells.size() > numColumns) {
            numColumns = rowPtr->cells.size();
        }
    }
    if(errorFound) {
	exit(3);
    }
}

int CSV_File::num_rows() {
    return rows.size();
}

int CSV_File::num_cols() {
    return numColumns;
}

void CSV_File::add_column(const string& name, CSV_Column::Type type) 
{
    CSV_Column* col = new CSV_Column(name, type);
    columns.push_back(col);
    numColumns++;
}

void CSV_File::add_row(CSV_Row* row) 
{
    rows.push_back(row);
}

ostream& operator<<(ostream& os, const CSV_File& file) {
    /*
    os << "Number of columns: " << file.numColumns << endl;
    os << "Number of rows: " <<  file.rows.size() << endl;
    */
    if(file.table) {
	// Have to output column titles first
	for(int col = 0; col < file.numColumns; col++) {
	    if(col != 0) {
		os << ',';
	    }
	    os << *(file.columns[col]);
	}
	os << endl;
    }
    // For each row, output each cell value
    for(int row = 0; row < file.rows.size(); row++) {
	os << *(file.rows[row]);
    }
    return os;
}
