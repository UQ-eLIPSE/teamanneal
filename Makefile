PROGRAMS = filedata_test
FILEDATA_TEST_OBJECTS = filedata.o filedata_test.o exceptions.o

# Default C compiler
CC=gcc

# Default C++ compiler
CXX=g++

# Default C compilation options
CFLAGS=-Wall

#Default C++ compilation options
CXXFLAGS=-Wall -std=c++11

all: $(PROGRAMS)

filedata_test: $(FILEDATA_TEST_OBJECTS)
	$(CXX) -o $@ $^

clean:
	rm $(PROGRAMS) *.o
