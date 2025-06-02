@startuml "Project Operation - Employee Attendance Tracking Activity Diagram"

' Style settings
skinparam ActivityBackgroundColor #FAFAFA
skinparam ActivityBorderColor #073B4C
skinparam ActivityDiamondBackgroundColor #E9ECEF
skinparam ActivityDiamondBorderColor #073B4C
skinparam ActivityStartColor #06D6A0
skinparam ActivityEndColor #EF476F
skinparam ArrowColor #073B4C
skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam handwritten false
skinparam noteBackgroundColor #FFE0B2
skinparam noteBorderColor #FF9800

' Title
title Project Operation - Employee Attendance Tracking Activity Diagram

' Start
start

' Initial actions
:User logs into system;

' Determine user type
if (User is Field Operator?) then (yes)
  ' Field Operator path
  :Navigate to Project Operation module;
  :Select "Track Employee Attendance";
  
  ' Check-in/Check-out decision
  if (Checking in?) then (yes)
    :Select "Check In" option;
    :System captures current time;
    :System verifies location (GPS);
    
    ' Location verification
    if (Location matches project site?) then (yes)
      :Select project from list;
      :Select assigned task/role;
      :Add check-in notes (optional);
      :Confirm check-in;
      :System records check-in data;
      :System displays confirmation;
    else (no)
      :System displays location warning;
      if (Override location warning?) then (yes)
        :Provide reason for location mismatch;
        :System flags check-in for review;
        :System records check-in with flag;
      else (no)
        :Cancel check-in;
        stop
      endif
    endif
    
  else (no)
    ' Check-out process
    :Select "Check Out" option;
    :System displays active check-in;
    :System captures current time;
    :Add check-out notes (optional);
    :Confirm check-out;
    :System calculates hours worked;
    :System records check-out data;
    :System displays summary;
  endif
  
else (no)
  ' Base Chief or Manager path
  if (User is Base Chief or Manager?) then (yes)
    :Navigate to Project Operation module;
    :Select "Track Employee Attendance";
    
    ' View options
    if (View attendance records?) then (yes)
      :Select "View Attendance Records";
      :Select date range;
      :Select project (optional);
      :Select employee(s) (optional);
      :System displays filtered records;
      
      ' Export option
      if (Export report?) then (yes)
        :Select export format (PDF/Excel);
        :System generates report;
        :Download report;
      else (no)
        :View on screen;
      endif
      
    else (no)
      ' Modify records
      if (Modify attendance record?) then (yes)
        ' Check time constraint
        :Select record to modify;
        :System checks record timestamp;
        
        if (Record within 48-hour window?) then (yes)
          :Edit attendance details;
          :Provide reason for modification;
          :Submit changes;
          :System logs modification details;
          :System updates record;
        else (no)
          :System displays time constraint error;
          :Request special authorization;
          
          ' Special authorization process
          if (Special authorization granted?) then (yes)
            :Edit attendance details;
            :Provide reason for modification;
            :Submit changes with authorization;
            :System logs modification with authorization;
            :System updates record;
          else (no)
            :Modification rejected;
          endif
        endif
      else (no)
        ' Generate reports
        :Select "Generate Attendance Report";
        :Configure report parameters;
        note right
          Parameters:
          - Date range
          - Project(s)
          - Employee(s)
          - Department(s)
          - Report type
        end note
        :Generate report;
        :Review report;
        :Export or share report;
      endif
    endif
  endif
endif

' End
stop

note right
  <b>Constraints:</b>
  - Attendance records cannot be modified after 48 hours
  - Special authorization required for late modifications
  - All attendance activities are logged with user info
  - System enforces shift duration limits (max 12 hours)
end note

@enduml 