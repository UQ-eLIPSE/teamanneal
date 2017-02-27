//
// filedata.cpp
//
// Note: Requires C++ 11 (use of nullptr)

#include "filedata.hh"
#include "exceptions.hh"
#include <stdio.h>

FileData::FileData(const char* filename) :
	contents(nullptr),
	size(0)
{
    /* Open file for reading */
    FILE* fileHandle = fopen(filename, "r");

    if(fileHandle) { 
	// File open succeeded.

	// Find out the size of the file by seeking to the end 
	fseek(fileHandle, 0, SEEK_END);
	this->size = ftell(fileHandle);

	//Come back to the start of the file
	rewind(fileHandle);

	// Allocate space for the file contents plus a terminating null character
	this->contents = new char[this->size + 1];

	// Read the whole file
	if(fread(this->contents, 1, this->size, fileHandle) != this->size) {
	    /* We could not read the whole file */
	    delete this->contents;
	    fclose(fileHandle);
	    // Throw exception
	    throw FileReadException(filename);
	}
	// If we get here, we have read the complete file
	fclose(fileHandle);
    } else {
	/* Unable to open file for reading */
	throw FileOpenException(filename);
    }

    /* Null terminate the buffer */
    this->contents[this->size] = '\0';
}


// Destructor
FileData::~FileData() 
{
    delete contents;
}

// Get operators
char* FileData::getContents()
{
    return contents;
}

size_t FileData::getSize()
{
    return size;
}
