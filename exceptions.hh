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

class AnnealException : public std::exception {
public:
    string message;

    AnnealException(const char* mesg);
    AnnealException(const char* mesg1, const char* mesg2);

    virtual const char* what() const noexcept;
};

#endif
