if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/Pablo/.gradle/caches/8.10.2/transforms/bf0d755f895997cfdcad9408cc4e7c52/transformed/hermes-android-0.76.6-release/prefab/modules/libhermes/libs/android.x86_64/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/Pablo/.gradle/caches/8.10.2/transforms/bf0d755f895997cfdcad9408cc4e7c52/transformed/hermes-android-0.76.6-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

