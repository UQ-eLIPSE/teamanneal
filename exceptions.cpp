//
// exceptions.cpp
//

#include "exceptions.hh"
#include <sstream>

//////////////////////////////////////////////////////////////////////////////
// FileException

const char* FileException::what() const noexcept
{
    return message.c_str();
}

//////////////////////////////////////////////////////////////////////////////
// FileReadException

FileReadException::FileReadException(const char* filename)
{
    std::stringstream s;
    
    s << "Unable to read file '" << filename << "'";
    message = s.str();
}

//////////////////////////////////////////////////////////////////////////////
// FileOpenException

FileOpenException::FileOpenException(const char* filename)
{
    std::stringstream s;
    
    s << "Unable to open file '" << filename << "'";
    message = s.str();
}

//////////////////////////////////////////////////////////////////////////////
// AnnealException

AnnealException::AnnealException(const char* mesg)
{
    message = mesg;
}

AnnealException::AnnealException(const char* mesg1, const char* mesg2)
{
    message = mesg1;
    message += mesg2;
}

const char* AnnealException::what() const noexcept
{
    return message.c_str();
}

