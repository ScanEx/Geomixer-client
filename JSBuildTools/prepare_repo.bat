@echo off
git submodule sync
git submodule update --init --recursive

set isJake=
FOR /F "usebackq delims==" %%i IN (`npm list -parseable -g jake`) DO set isJake=1
if "%isJake%"=="" call npm i -g jake

set isGulp=
FOR /F "usebackq delims==" %%i IN (`npm list -parseable -g gulp`) DO set isGulp=1
if "%isGulp%"=="" call npm i -g gulp

call npm i

pushd common_components\builder
call npm i
popd