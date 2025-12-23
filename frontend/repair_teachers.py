import os

file_path = 'src/views/apps/Teachers.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
modal_lines = []
in_modal = False
found_premature_close = False
removed_placeholder = False

placeholder_txt = '<!-- ... cell templates ... -->'
modal_start_txt = '<!-- Import Modal -->'
modal_end_txt = '</Teleport>'
datatable_close_txt = '</DataTable>'

# First pass: Filter out premature close and placeholder, and extract modal
temp_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    
    # 1. Remove placeholder
    if placeholder_txt in line:
        # Skip this line
        i += 1
        continue
        
    # 2. Remove premature </DataTable>
    # Logic: The first </DataTable> we encounter is the premature one 
    # (because the real one is at the end).
    # Safe check: if it is followed closely by <!-- Import Modal -->
    if datatable_close_txt in line and not found_premature_close:
        # Check context: Is import modal starting soon?
        # Or look ahead?
        # Let's assume the first one IS the premature one provided it's line < 200
        if i < 200: 
             found_premature_close = True
             i += 1
             continue

    # 3. Extract Import Modal
    if modal_start_txt in line:
        in_modal = True
        modal_lines.append(line)
        i += 1
        continue
    
    if in_modal:
        modal_lines.append(line)
        if modal_end_txt in line:
            in_modal = False
        i += 1
        continue
        
    temp_lines.append(line)
    i += 1

# Now temp_lines has the cleaned content (minus modal).
# modal_lines has the extracted modal.

# Second pass: Insert modal at the end, after </DataTable>
final_lines = []
inserted = False

# Find the LAST </DataTable> in temp_lines to insert after
# Actually, since we removed the first one, there should be only one left (the real one).
# We want to insert AFTER it.

for line in temp_lines:
    final_lines.append(line)
    if datatable_close_txt in line:
        # This is the real closing tag
        if not inserted:
             final_lines.extend(modal_lines)
             inserted = True

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print(f"Repaired {file_path}. Removed premature tag: {found_premature_close}. Inserted modal: {inserted}")
