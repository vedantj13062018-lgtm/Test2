if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/apple/.gradle/caches/transforms-3/0cabf0bd2510efd6dbb2284ec0c525ed/transformed/jetified-hermes-android-0.73.2-debug/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/apple/.gradle/caches/transforms-3/0cabf0bd2510efd6dbb2284ec0c525ed/transformed/jetified-hermes-android-0.73.2-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

