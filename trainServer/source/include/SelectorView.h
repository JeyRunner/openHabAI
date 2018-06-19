//
// Created by Tristan Ratz on 07.06.18.
//

#ifndef OPENHABAI_SELECTORVIEW_H
#define OPENHABAI_SELECTORVIEW_H

#include <stdlib.h>
#include <ApiJsonObject.h>

using namespace std;


class SelectorView : public ApiJsonObject
{
  public:
     vector<string> options;

     SelectorView() = default;

    SelectorView(string label, vector<string> options) :
         options(options),
         optionsValue(options.size()),
         name(label)
     {
       // Is already set somewhere (implemented for radio buttons)
       bool hasValue = false;
       for (bool b : optionsValue)
         hasValue |= b;

       // First option is selected
       if (optionsValue.size() > 0 && !hasValue)
        optionsValue[0] = true;
     }

     void params() override {
      ApiJsonObject::params();
       param("options", options);
       param("optionValues", optionsValue);
       param("name", name);
     }

     /**
      * A function to trigger a on change function for the selection view
      * @param onChange.values True on every selected value
      * @param onChange.changeValues True on every changed index of options
      */
     void onSelectionChange(function<void (vector<bool> values, vector<bool> changedValues)> onChange)
     {
       this->onChange = onChange;
     }

  private:
     vector<bool> optionsValue;
     string name;
     function<void (vector<bool>, vector<bool>)> onChange = nullptr;

};


#endif //OPENHABAI_SELECTORVIEW_H
