/*
** csv.hh
*/

#ifndef CSV_HH
#define CSV_HH

#include <string>
#include <vector>
#include <iostream>

using namespace std;

class CSV_Cell {
public:
    string str;
    double d;

    // Constructor
    CSV_Cell();
    CSV_Cell(const string& str);
    CSV_Cell(double d);
    CSV_Cell(const char* str);

    // Output operator
    friend ostream& operator<<(ostream& os, const CSV_Cell& file);
};

class CSV_Row {
public:
    vector<CSV_Cell*> cells; /* Indexed by column number */

    // Constructor
    CSV_Row();

    // Member functions
    void append(CSV_Cell* cell);
    void append(const string& str);

    // Output operator
    friend ostream& operator<<(ostream& os, const CSV_Row& file);
};

class CSV_Column {
public:
typedef enum { NULLCOLUMN, EMPTY, NUMBER, STRING, QUOTE_ERROR, UNKNOWN } Type;
    string name;
    CSV_Column::Type type;

    // Constructor
    CSV_Column(const string& name, CSV_Column::Type type);

    // Output operator
    friend ostream& operator<<(ostream& os, const CSV_Column& file);
};

class CSV_File {
public:
    bool table;          /* True if this represents a table with named columns */
    int numColumns;	// Same as columns.size() if table, otherwise records number of columns
    vector<CSV_Column*> columns;	/* Indexed by column number, only valid for a table */
    vector<CSV_Row*> rows;		/* Indexed by row number, excludes titles if this is a table */

    // Constructors
    // - empty structure
    CSV_File();
    // - from file contents
    // buffer - null terminated file contents
    // separator - the separator between fields - usually a comma
    // quote - the permitted quote character which can be present at the start and end
    //              of the field. It allows separators and doubled quote characters to 
    //              be contained in the field text
    // expectTable - true if a rectangular table of data is expected, i.e., same number of
    //              columns in every row, false otherwise.
    CSV_File(char* buffer, char separator, char quote, bool expectTable);

    // Other member functions
    int num_rows();
    int num_cols();
    void add_column(const string& name, CSV_Column::Type type = CSV_Column::UNKNOWN);
    void add_row(CSV_Row* row);

    // Output operator
    friend ostream& operator<<(ostream& os, const CSV_File& file);
};

#endif /* CSV_HH */
