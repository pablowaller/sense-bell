if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/Pablo/.gradle/caches/8.10.2/transforms/ef1ffc8877b83f21070ed1b5bc0de92b/transformed/hermes-android-0.76.6-debug/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/Pablo/.gradle/caches/8.10.2/transforms/ef1ffc8877b83f21070ed1b5bc0de92b/transformed/hermes-android-0.76.6-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

