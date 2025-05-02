#pragma once

#if defined(_WIN32)
  #if defined(MAILIO_EXPORTS)
    #define MAILIO_EXPORT __declspec(dllexport)
  #else
    #define MAILIO_EXPORT __declspec(dllimport)
  #endif
#else
  #define MAILIO_EXPORT
#endif