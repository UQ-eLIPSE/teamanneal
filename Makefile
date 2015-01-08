PROGRAMS = filedata_test csv_test json_test csv_extract_test teamanneal
FILEDATA_TEST_OBJECTS = filedata.o filedata_test.o exceptions.o
CSV_TEST_OBJECTS = csv.o csv_test.o filedata.o exceptions.o
JSON_TEST_OBJECTS = filedata.o jsonExceptions.o json.o json_test.o exceptions.o stringCursor.o
CSV_EXTRACT_TEST_OBJECTS = csv.o csv_extract.o csv_extract_test.o person.o attribute.o exceptions.o \
	filedata.o 
TEAMANNEAL_OBJECTS = teamanneal.o csv.o csv_extract.o person.o attribute.o exceptions.o filedata.o \
	annealinfo.o json.o jsonExtract.o jsonExceptions.o stringCursor.o level.o constraint.o
OBJS = $(FILEDATA_TEST_OBJECTS) $(CSV_TEST_OBJECTS) $(JSON_TEST_OBJECTS) \
	$(CSV_EXTRACT_TEST_OBJECTS) $(TEAMANNEAL_OBJECTS)

# Default C compiler
CC=gcc

# Default C++ compiler
CXX=g++

# Default C compilation options
CFLAGS=-Wall -MMD

#Default C++ compilation options
CXXFLAGS=-Wall -std=c++11 -MMD

all: $(PROGRAMS)

filedata_test: $(FILEDATA_TEST_OBJECTS)
	$(CXX) -o $@ $^

csv_test: $(CSV_TEST_OBJECTS)
	$(CXX) -o $@ $^

json_test: $(JSON_TEST_OBJECTS)
	$(CXX) -o $@ $^

csv_extract_test: $(CSV_EXTRACT_TEST_OBJECTS)
	$(CXX) -o $@ $^

teamanneal: $(TEAMANNEAL_OBJECTS)
	$(CXX) -o $@ $^

clean:
	rm -f $(PROGRAMS) *.o *.d

# Include dependencies for each source
-include $(OBJS:%.o=%.d)
