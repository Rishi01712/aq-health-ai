# split_pkl.py
file_path = 'aqi_disease_model.pkl'  # Your original file
chunk_size = 100 * 1024 * 1024  # 100 MB per chunk

with open(file_path, 'rb') as f:
    data = f.read()

num_chunks = (len(data) + chunk_size - 1) // chunk_size
for i in range(num_chunks):
    chunk_data = data[i*chunk_size:(i+1)*chunk_size]
    chunk_file = f'aqi_disease_model_part_{i}.bin'
    with open(chunk_file, 'wb') as chunk_f:
        chunk_f.write(chunk_data)
    print(f'Created {chunk_file} ({len(chunk_data) / (1024*1024):.2f} MB)')

print(f'Split into {num_chunks} parts.')