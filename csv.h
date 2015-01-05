/*
** csv.h
*/

#ifndef CSV_H
#define CSV_H

typedef enum { NULLCOLUMN, EMPTY, NUMBER, STRING, QUOTE_ERROR } ColumnType;

typedef struct {
    char* str;
    double d;
} CSV_Cell;

typedef struct {
    int numCells;
    CSV_Cell* cells; /* Indexed by column number */
} CSV_Row;

typedef struct {
    char* name;
    ColumnType type;
} CSV_Column;

typedef struct {
    int table;          /* True if this represents a table with named columns */
    int numColumns;
    int numRows;
    CSV_Column* columns; /* Indexed by column number */ /* Only valid for a table, null otherwise */
    CSV_Row* rows; /* Indexed by row number */ /* Excludes titles if this is table */
} CSV_File;

/* process_csv_file()
** buffer - null terminated file contents
** separator - the separator between fields - usually a comma
** quote - the permitted quote character which can be present at the start and end
**              of the field. It allows separators and doubled quote characters to 
**              be contained in the field text
** expectTable - true if a rectangular table of data is expected, i.e., same number of
**              columns in every row, false otherwise.
*/
CSV_File* process_csv_file(char* buffer, char separator, char quote, int expectTable);

void print_file_data(CSV_File* data, char separator);

#endif /* CSV_H */
