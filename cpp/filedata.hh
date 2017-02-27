/*
** filedata.hh
*/

#ifndef FILEDATA_HH
#define FILEDATA_HH

#include <cstddef>	// for size_t

class FileData {
protected:
    char* contents;	/* Contents of file - "size" bytes of data, followed by a null character */
    size_t size;

public:
    // Constructor
    FileData(const char* filename);

    // Destructor
    ~FileData();

    // Get data
    char* getContents();
    size_t getSize();
};

#endif // FILEDATA_HH
