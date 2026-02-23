if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "/Users/apple/.gradle/caches/transforms-3/2f78e4fa0cbafa18af5cc93866d26dbf/transformed/jetified-fbjni-0.5.1/prefab/modules/fbjni/libs/android.arm64-v8a/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/apple/.gradle/caches/transforms-3/2f78e4fa0cbafa18af5cc93866d26dbf/transformed/jetified-fbjni-0.5.1/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

