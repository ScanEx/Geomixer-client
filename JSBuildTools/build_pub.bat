call gulp gmx-pub

set destination="..\..\Geomixer-dist"

xcopy .. %destination%

robocopy ..\common_components\dist %destination%\common_components\dist /S

robocopy ..\dist %destination%\dist /S

robocopy ..\img %destination%\img /S

robocopy ..\plugins\external %destination%\plugins\external /S

robocopy ..\src\GridPlugin %destination%\src\GridPlugin /S
