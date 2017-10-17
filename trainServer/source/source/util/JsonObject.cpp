/*
 * File:   JsonObject.h
 * Author: Joshua Johannson
 *
  */
#include "util/JsonObject.h"
#include <boost/filesystem.hpp>
namespace fs = boost::filesystem;


JsonObject::JsonObject()
{
  setLogName("JSOBJ", "jsonObject");
}


// -- TO FROM JSON --------------------------------------------------------
Json JsonObject::toJson()
{
  Json j{};
  for (pair<string, boost::any> el : paramPointers) {

    if (el.second.type() == typeid(int*))
      j[el.first] = *boost::any_cast<int *>(el.second);
    else if (el.second.type() == typeid(string*))
      j[el.first] = *boost::any_cast<string *>(el.second);
    else if (el.second.type() == typeid(float*))
      j[el.first] = *boost::any_cast<float *>(el.second);
    else if (el.second.type() == typeid(double *))
      j[el.first] =  *boost::any_cast<double *>(el.second);
    else if (el.second.type() == typeid(bool *))
      j[el.first] =  *boost::any_cast<bool *>(el.second);

  }

  return j;
}

void JsonObject::fromJson(Json params)
{
  for (Json::iterator it = params.begin(); it != params.end(); ++it) {
    auto i = paramPointers.find(it.key());
    if (i == paramPointers.end())
      continue;

    pair<string, boost::any> el = *i;

    if (el.second.type() == typeid(int*))
      *boost::any_cast<int *>(el.second) = it.value();
    else if (el.second.type() == typeid(string*))
      *boost::any_cast<string *>(el.second) = it.value();
    else if (el.second.type() == typeid(float*))
      *boost::any_cast<float *>(el.second) = it.value();
    else if (el.second.type() == typeid(double *))
      *boost::any_cast<double *>(el.second) = it.value();
    else if (el.second.type() == typeid(bool *))
      *boost::any_cast<bool *>(el.second) = it.value();
  }
}


// -- SAVE LOAD --------------------------------------------------------
bool JsonObject::save(string path, string fileName)
{
  string full = path + "/" + fileName;

  try {
    fs::create_directories(path);
  }
  catch(exception &e) {
    err("save to " + full, "can not create directory: " + string(e.what()));
    return false;
  }

  ofstream stream;
  stream.open(full);
  if (!stream.is_open()) {
    stream.close();
    err("save to " + full);
    return false;
  }
  stream << toJson().dump(2);
  stream.close();
  ok("save to " + full);
  return true;
}

bool JsonObject::load(string path, string fileName)
{
  ifstream stream;
  string full = path + "/" + fileName;

  stream.open(full);
  if (!stream.is_open()) {
    stream.close();
    err("load from " + full);
    return false;
  }

  Json json(stream);
  fromJson(json);

  stream.close();
  ok("load from " + full);
  return true;
}

void JsonObject::loadChilds()
{

}



void JsonObject::setJsonParams(map<string, boost::any>  params)
{
  this->paramPointers = params;
}