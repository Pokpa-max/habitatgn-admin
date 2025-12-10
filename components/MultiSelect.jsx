import React from "react";
import { Controller } from "react-hook-form";
import Select from "react-select";

const MultiSelect = ({
    options,
    required = false,
    control,
    name,
    ...nextProps
}) => (
    <Controller
        name={name}
        rules={{ required }}
        control={control}
        render={({ field: { value, onChange, onBlur } }) => {
            return (
                <Select
                    isClearable
                    styles={{
                        input: (base) => ({
                            ...base,
                            "input:focus": {
                                boxShadow: "none",
                            },
                            height: "2rem",
                        }),
                        placeholder: (base) => ({
                            ...base,
                            fontSize: "14px",
                        }),
                        control: (base, state) => ({
                            ...base,
                            border: state.isFocused
                                ? "2px solid #20B2AA"
                                : "1px solid #d1d5db",
                            borderRadius: "0.125rem",
                            "&:hover": {
                                border: "1px solid #d1d5db",
                            },
                            boxShadow: "none",
                        }),
                    }}
                    options={options}
                    onChange={(options) =>
                        onChange(options?.map((option) => option.value))
                    }
                    isMulti={true}
                    onBlur={onBlur}
                    value={options.filter((option) =>
                        value?.includes(option.value)
                    )}
                    defaultValue={null}
                    {...nextProps}
                />
            );
        }}
    />
);

export default MultiSelect;
