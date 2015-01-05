//
// exceptions.hh
//
// Standard exceptions for handling
//	- unable to open file
//	- unable to read complete file 
//

#ifndef EXCEPTIONS_HH
#define EXCEPTIONS_HH

#include <exception>
#include <string>

using namespace std;

class FileException : public std::exception {
public:
    string message;

    virtual const char* what() const noexcept;
};

class FileReadException : public FileException {
public:
    FileReadException(const char* filename);
};

class FileOpenException : public FileException {
public:
    FileOpenException(const char* filename);
};

#endif
