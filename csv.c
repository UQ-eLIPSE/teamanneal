/*
** csv.c
*/

#include "csv.h"
#include <stdio.h>
#include <assert.h>
#include <stdlib.h>

/* Given the file contents pointed to by *bufPtr, return a pointer to the 
** beginning of the next line of data (i.e. *bufPtr) or NULL if there is
** no further data (i.e. **bufPtr is null). *bufPtr is advanced to just
** after any newline (or carriage return or newline-carriage return or
** carriage return-newline.
*/
char* get_line(char** bufPtr) {
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
int count_fields(char* line, char separator, char quote) {
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
ColumnType get_field(char** linePtr, CSV_Cell* cellPtr, char separator, char quote) {
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
	    return QUOTE_ERROR;
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
	return EMPTY;
    }
    /* Work out the type of the field, set the value and return
    ** the appropriate type indicator.
    */
    cellPtr->str = field;
    cellPtr->d = 0.0;
    if(*field == '\0') {
	return EMPTY;
    }
    cellPtr->d = strtod(field, &firstCharAfterConversion);
    if(cursor == firstCharAfterConversion) {
	/* Whole field was consumed - value was a number */
	return NUMBER;
    }

    /* Return value isn't empty or a number - must be a string */
    return STRING;
}

CSV_File* process_csv_file(char* buffer, char separator, char quote, int expectTable) {
    char* bufPtr = buffer;
    char* cursor;
    CSV_File* data;
    int col, row, line, errorFound;
    ColumnType datatype;
    CSV_Row* rowPtr;

    assert(buffer);

    data = (CSV_File*)malloc(sizeof(CSV_File));
    data->numRows = 0;
    data->rows = 0;
    data->columns = 0;
    data->numColumns = 0;
    data->table = expectTable;
    line = 0;
    if(expectTable) {
        cursor = get_line(&bufPtr);	/* first row - assumed to contain column names */
        line++;
        /* Work out the number of columns based on the number of fields in the first row. This will
        ** be valid if we're expecting a table of data, otherwise, this will not be relevant.
        */
        data->numColumns = count_fields(cursor, separator, quote);
        data->columns = (CSV_Column*)malloc(sizeof(CSV_Column) * (data->numColumns));
        /* Populate the column names based on the values in the first row */
        for(col=0; col < data->numColumns; col++) {
            assert(cursor);
            data->columns[col].name = cursor;
            data->columns[col].type = EMPTY; /* default value - we'll update the column type when we
                                             ** read the actual data, rather than the headings. */
            if(get_field(&cursor, NULL, separator, quote) == QUOTE_ERROR) {
                fprintf(stderr, "Line %d - error in quoted field\n", line);
                errorFound = 1;
            }
        }
    } else {
        data->numColumns = 0;
        data->columns = 0;
    }
    /* Read all the remaining rows */
    row = 0;
    errorFound = 0;
    while((cursor = get_line(&bufPtr))) {
        line++;
        /* Ensure we have enough space to store this row in our array of rows */
	data->rows = (CSV_Row*)realloc(data->rows, sizeof(CSV_Row)*(row + 4)/4*4);
        rowPtr = &(data->rows[row]);
        rowPtr->numCells = 0;
        rowPtr->cells = 0;
        while(cursor) {
            rowPtr->cells = (CSV_Cell*)realloc(rowPtr->cells, sizeof(CSV_Cell) * (rowPtr->numCells + 4)/4*4);
            datatype = get_field(&cursor, &(rowPtr->cells[rowPtr->numCells]), separator, quote);
            //printf("%s ", rowPtr->cells[rowPtr->numCells].str);
            fflush(stdout);
            if(datatype == QUOTE_ERROR) {
                fprintf(stderr, "Line %d - error in quoted field\n", line);
                errorFound = 1;
            } else if(expectTable && rowPtr->numCells < data->numColumns &&
                    datatype > data->columns[rowPtr->numCells].type) {
                /* This is supposed to be a table and we haven't exceeded the column range
                ** and the type of the column is different to what we thought it was previously
                */
                data->columns[rowPtr->numCells].type = datatype;
            }
            (rowPtr->numCells)++;
        }
        // Run out of fields in line. If this is a table, check we got the number expected
        if(expectTable && rowPtr->numCells != data->numColumns) {
            fprintf(stderr, "Line %d - got %d fields, expecting %d)\n",
                    line, rowPtr->numCells, data->numColumns);
            errorFound = 1;
            break;
        }
        if(!expectTable && rowPtr->numCells > data->numColumns) {
            data->numColumns = rowPtr->numCells;
        }
	row++;
    }
    if(errorFound) {
	exit(3);
    }
    data->numRows = row;
    return data;
}

void print_file_data(CSV_File* data, char separator) {
    int r,c;
    printf("Number of columns: %d\n", data->numColumns);
    printf("Number of rows: %d\n", data->numRows);
    if(data->table) {
        for(c=0; c < data->numColumns; c++) {
            if(c != 0) {
                putchar(separator);
            }
            printf("%s", data->columns[c].name);
            if(data->columns[c].type == STRING) {
                printf("(STRING)");
            } else if(data->columns[c].type == NUMBER) {
                printf("(NUMBER)");
            } else if(data->columns[c].type == EMPTY) {
                printf("(EMPTY)");
            } else {
                printf("(UNKNOWN)");
            }
        }
    }
    for(r=0; r < data->numRows; r++) {
	printf("\n");
	for(c=0; c < data->rows[r].numCells; c++) {
	    if(c != 0) {
		putchar(separator);
	    }
	    // This doesn't work if the string has a comma in it - we should really
	    // enclose such strings in double quotes (and escape double quotes in the 
	    // string
	    printf("%s", data->rows[r].cells[c].str);
	}
    }
    printf("\n");
}
