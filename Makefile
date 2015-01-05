PROGRAMS = filedata_test csv_test
FILEDATA_TEST_OBJECTS = filedata.o filedata_test.o exceptions.o
CSV_TEST_OBJECTS = csv.o csv_test.o filedata.o exceptions.o

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

csv_test: $(CSV_TEST_OBJECTS)
	$(CXX) -o $@ $^

clean:
	rm $(PROGRAMS) *.o
