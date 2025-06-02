@startuml "Project Operation - Daily Reports Activity Diagram"

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
title Project Operation - Daily Reports Activity Diagram

' Start
start

' Initial actions
:Field Operator logs into system;
:Navigate to Project Operation module;
:Select "Manage Daily Reports";

' Decision point
if (Creating new report?) then (yes)
  :Select "Create New Report";
  :Select project from list;
  :Enter report date;
  
  ' Report entry process
  :Fill report details;
  note right
    Required fields:
    - Project phase
    - Activities completed
    - Resources used
    - Hours worked
  end note
  
  ' Supporting documents
  :Attach supporting documents;
  note right
    - Photos
    - Measurements
    - Safety reports
    - Maximum size: 50MB
  end note
  
  ' Validation process
  if (All required fields completed?) then (yes)
    :System validates entry;
    
    if (Validation successful?) then (yes)
      :Save report as draft;
      
      ' Submission decision
      if (Submit report now?) then (yes)
        :Submit report for review;
        :System notifies Base Chief;
      else (no)
        :Save as draft;
        note right: Can be edited until submission
      endif
      
    else (no)
      :Display validation errors;
      :Correct errors;
      backward :Return to form;
    endif
    
  else (no)
    :System highlights missing fields;
    backward :Complete required fields;
  endif
  
else (no)
  ' View/Edit existing report
  :View list of existing reports;
  :Filter reports by date/status;
  :Select report to view;
  
  if (Report status is "Draft"?) then (yes)
    if (Edit report?) then (yes)
      :Modify report details;
      :Update attachments if needed;
      
      if (Submit report?) then (yes)
        :Submit report for review;
        :System notifies Base Chief;
      else (no)
        :Save updated draft;
      endif
      
    else (no)
      :View report details;
    endif
    
  else (no)
    ' Report already submitted
    :View report details;
    
    if (Report status is "Needs Revision"?) then (yes)
      :View Base Chief comments;
      :Make required changes;
      :Resubmit report;
      :System notifies Base Chief;
    else (no)
      ' Report is approved or finalized
      :Download report if needed;
    endif
  endif
endif

' Base Chief review process
if (User is Base Chief?) then (yes)
  :View pending reports;
  :Select report to review;
  :Review report details and attachments;
  
  if (Report meets requirements?) then (yes)
    :Approve report;
    :Add approval comments;
    :System finalizes report;
    :System notifies Field Operator;
  else (no)
    :Request revisions;
    :Add revision comments;
    :System updates report status;
    :System notifies Field Operator;
  endif
endif

' End
stop

note right
  <b>Constraints:</b>
  - Reports must be submitted by end of shift
  - Cannot be modified after approval
  - All report activities are logged
end note

@enduml 